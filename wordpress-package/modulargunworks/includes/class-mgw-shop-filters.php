<?php
/**
 * Modular Gunworks - Reliable Shop Filters
 * Bypasses broken WooCommerce layered nav count logic. Outputs Brand, Caliber, etc. with correct counts.
 */
defined('ABSPATH') || exit;

class MGW_Shop_Filters {

    private static $filter_attrs = [
        'pa_brand'       => 'Brand',
        'pa_caliber'     => 'Caliber',
        'pa_capacity'     => 'Capacity',
        'pa_bullet_type'  => 'Bullet Type',
        'pa_grain_weight' => 'Grain',
    ];

    public static function init() {
        add_action('widgets_init', [__CLASS__, 'maybe_unregister_widgets'], 20);
    }

    /** Hide WooCommerce layered nav widgets - we render filters ourselves */
    public static function maybe_unregister_widgets() {
        // Don't unregister - we'll just output before dynamic_sidebar and let WC widgets (Price, Active) show
    }

    /** Get base URL for filter links (current shop/category page) */
    public static function get_base_url() {
        global $wp;
        if ('' !== get_option('permalink_structure')) {
            $base = get_post_type_archive_link('product');
            if (is_product_category()) {
                $term = get_queried_object();
                $base = get_term_link($term);
            } elseif (is_tax('pa_brand')) {
                $term = get_queried_object();
                $base = get_term_link($term);
            }
            $base = is_wp_error($base) ? home_url($wp->request) : $base;
        } else {
            $base = home_url(add_query_arg([], $wp->request));
        }
        return remove_query_arg(['min_price', 'max_price', 'filter_stock', 'orderby', 's', 'paged'] + array_map(function ($t) {
            return 'filter_' . str_replace('pa_', '', $t);
        }, array_keys(self::$filter_attrs)), $base);
    }

    /** Get ALL product IDs matching current context, optionally excluding one attribute (for count accuracy) */
    public static function get_current_product_ids_excluding($exclude_taxonomy = null) {
        global $wpdb;
        $pq = function_exists('WC_Query') ? WC_Query::get_main_query() : null;
        if (!$pq || !$pq->get('wc_query')) {
            return [];
        }
        $tax_query = WC_Query::get_main_tax_query();
        if ($exclude_taxonomy && !empty($tax_query)) {
            $tax_query = array_filter($tax_query, function ($q) use ($exclude_taxonomy) {
                return !is_array($q) || (isset($q['taxonomy']) && $q['taxonomy'] !== $exclude_taxonomy);
            });
        }
        $meta_query = WC_Query::get_main_meta_query();
        $tq = new WP_Tax_Query($tax_query);
        $mq = new WP_Meta_Query($meta_query);
        $tax_sql = $tq->get_sql($wpdb->posts, 'ID');
        $meta_sql = $mq->get_sql('post', $wpdb->posts, 'ID');
        $hide = get_option('woocommerce_hide_out_of_stock_items') === 'yes';
        $stock = $hide ? " AND {$wpdb->posts}.ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='_stock_status' AND meta_value='instock') " : '';
        $search = WC_Query::get_main_search_query_sql();
        $search_clause = $search ? " AND ({$search}) " : '';
        $sql = "SELECT DISTINCT {$wpdb->posts}.ID FROM {$wpdb->posts} {$tax_sql['join']} {$meta_sql['join']}
            WHERE {$wpdb->posts}.post_type='product' AND {$wpdb->posts}.post_status='publish' {$tax_sql['where']} {$meta_sql['where']}{$stock}{$search_clause}";
        $ids = $wpdb->get_col($sql);
        return $ids ? array_map('intval', $ids) : [];
    }

    /** Count products per term for given taxonomy - product set excludes this attribute so counts are "in current view" */
    public static function get_term_counts($taxonomy, $product_ids = null) {
        global $wpdb;
        if ($product_ids === null) {
            $product_ids = self::get_current_product_ids_excluding($taxonomy);
        }
        if (empty($product_ids)) {
            return [];
        }
        $ids_sql = '(' . implode(',', array_map('absint', $product_ids)) . ')';
        $tax_esc = esc_sql($taxonomy);
        $sql = "SELECT tt.term_id, COUNT(DISTINCT tr.object_id) AS cnt
            FROM {$wpdb->term_taxonomy} tt
            INNER JOIN {$wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tr.object_id IN {$ids_sql}
            WHERE tt.taxonomy = '{$tax_esc}'
            GROUP BY tt.term_id";
        $rows = $wpdb->get_results($sql, ARRAY_A);
        $counts = [];
        foreach ($rows as $r) {
            $counts[(int)$r['term_id']] = (int)$r['cnt'];
        }
        return $counts;
    }

    /** Currently chosen filter values from URL */
    public static function get_chosen() {
        $chosen = [];
        foreach (array_keys(self::$filter_attrs) as $tax) {
            $key = 'filter_' . str_replace('pa_', '', $tax);
            if (!empty($_GET[$key])) {
                $chosen[$tax] = array_map('sanitize_title', explode(',', wp_unslash($_GET[$key])));
            }
        }
        return $chosen;
    }

    /** Render a single attribute filter block */
    public static function render_filter_block($taxonomy, $title) {
        $terms = get_terms(['taxonomy' => $taxonomy, 'hide_empty' => true]);
        if (empty($terms)) {
            return;
        }
        $counts = self::get_term_counts($taxonomy);
        $base = self::get_base_url();
        $filter_name = 'filter_' . str_replace('pa_', '', $taxonomy);
        $chosen = self::get_chosen();
        $current = isset($chosen[$taxonomy]) ? $chosen[$taxonomy] : [];
        $has_visible = false;
        ob_start();
        echo '<div class="widget woocommerce widget_layered_nav woocommerce-widget-layered-nav"><h3 class="widget_title">' . esc_html($title) . '</h3><ul class="woocommerce-widget-layered-nav-list">';
        foreach ($terms as $term) {
            $cnt = isset($counts[$term->term_id]) ? $counts[$term->term_id] : 0;
            $is_set = in_array($term->slug, $current, true);
            if ($cnt <= 0 && !$is_set) {
                continue;
            }
            $has_visible = true;
            $new_filter = $current;
            if ($is_set) {
                $new_filter = array_values(array_diff($new_filter, [$term->slug]));
            } else {
                $new_filter[] = $term->slug;
            }
            $url = $base;
            if (!empty($new_filter)) {
                $url = add_query_arg($filter_name, implode(',', $new_filter), $url);
            } else {
                $url = remove_query_arg($filter_name, $url);
            }
            $url = str_replace('%2C', ',', $url);
            $link = '<a href="' . esc_url($url) . '" rel="nofollow">' . esc_html($term->name) . '</a>';
            $link .= ' <span class="count">(' . absint($cnt) . ')</span>';
            echo '<li class="woocommerce-widget-layered-nav-list__item ' . ($is_set ? 'woocommerce-widget-layered-nav-list__item--chosen chosen' : '') . '">' . $link . '</li>';
        }
        echo '</ul></div>';
        $html = ob_get_clean();
        if ($has_visible) {
            echo $html;
        }
    }

    /** Render all attribute filters */
    public static function render_filters() {
        if (!function_exists('WC') || (!is_shop() && !is_product_category() && !is_tax('pa_brand'))) {
            return;
        }
        foreach (self::$filter_attrs as $tax => $title) {
            if (taxonomy_exists($tax)) {
                self::render_filter_block($tax, $title);
            }
        }
    }
}

MGW_Shop_Filters::init();
