<?php
/**
 * Backfill filter attributes (caliber, bullet_type, grain_weight, brand, capacity) from product names.
 */
defined('ABSPATH') || exit;

class MGW_Populate_Attrs {

    const OPTION_LAST_RUN = 'mgw_populate_attrs_last_run';
    const OPTION_LAST_STATUS = 'mgw_populate_attrs_last_status';

    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_admin_page'], 99);
        add_action('admin_init', [$this, 'maybe_run_backfill']);
    }

    public function add_admin_page() {
        add_submenu_page(
            'tools.php',
            __('Populate Filter Attributes', 'mgw-populate-attrs'),
            __('Populate Filter Attributes', 'mgw-populate-attrs'),
            'manage_options',
            'mgw-populate-filter-attrs',
            [$this, 'render_admin_page']
        );
    }

    public function maybe_run_backfill() {
        if (!isset($_GET['page']) || $_GET['page'] !== 'mgw-populate-filter-attrs') {
            return;
        }
        if (!isset($_POST['mgw_populate_attrs_run']) || !current_user_can('manage_options')) {
            return;
        }
        check_admin_referer('mgw_populate_attrs_run');
        $result = $this->run_backfill();
        wp_safe_redirect(add_query_arg([
            'mgw_populate_done' => 1,
            'updated' => $result['updated'],
            'skipped' => $result['skipped'],
        ], admin_url('tools.php?page=mgw-populate-filter-attrs')));
        exit;
    }

    public function render_admin_page() {
        $last_run = get_option(self::OPTION_LAST_RUN, '');
        $last_status = get_option(self::OPTION_LAST_STATUS, '');
        $done = isset($_GET['mgw_populate_done']);
        $updated = isset($_GET['updated']) ? (int) $_GET['updated'] : 0;
        $skipped = isset($_GET['skipped']) ? (int) $_GET['skipped'] : 0;
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Populate Filter Attributes', 'mgw-populate-attrs'); ?></h1>
            <p><?php esc_html_e('This tool parses existing product names and populates WooCommerce attributes used by shop filters: Caliber, Bullet Type, Grain Weight, Brand, Capacity. For ammunition, it assigns products to Handgun, Rifle, Rimfire, or Shotgun subcategories.', 'mgw-populate-attrs'); ?></p>
            <?php if ($done && ($updated > 0 || $skipped > 0)) : ?>
                <div class="notice notice-success"><p>
                    <?php printf(esc_html__('Backfill complete. %d products updated, %d skipped (no changes needed).', 'mgw-populate-attrs'), $updated, $skipped); ?>
                </p></div>
            <?php endif; ?>
            <?php if ($last_run) : ?>
                <p><strong><?php esc_html_e('Last run:', 'mgw-populate-attrs'); ?></strong> <?php echo esc_html($last_run); ?></p>
                <?php if ($last_status) : ?>
                    <pre style="background:#f5f5f5;padding:1em;max-height:200px;overflow:auto;"><?php echo esc_html($last_status); ?></pre>
                <?php endif; ?>
            <?php endif; ?>
            <form method="post">
                <?php wp_nonce_field('mgw_populate_attrs_run'); ?>
                <p>
                    <button type="submit" name="mgw_populate_attrs_run" class="button button-primary"><?php esc_html_e('Run Backfill Now', 'mgw-populate-attrs'); ?></button>
                </p>
            </form>
        </div>
        <?php
    }

    /**
     * Run the backfill on all products.
     */
    public function run_backfill() {
        $log = [];
        $updated = 0;
        $skipped = 0;

        $args = [
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'        => 'ids',
        ];
        $ids = get_posts($args);
        $total = count($ids);
        $log[] = "Processing $total products...";

        $ammo_term_id = 0;
        $mag_term_id = 0;
        if (taxonomy_exists('product_cat')) {
            $t = get_terms(['taxonomy' => 'product_cat', 'slug' => 'ammunition', 'hide_empty' => false]);
            if (!is_wp_error($t) && !empty($t)) $ammo_term_id = (int) $t[0]->term_id;
            $t = get_terms(['taxonomy' => 'product_cat', 'slug' => 'magazines', 'hide_empty' => false]);
            if (!is_wp_error($t) && !empty($t)) $mag_term_id = (int) $t[0]->term_id;
        }

        foreach ($ids as $post_id) {
            $product = wc_get_product($post_id);
            if (!$product || !is_a($product, 'WC_Product')) {
                $skipped++;
                continue;
            }

            $name = $product->get_name();
            $terms = get_the_terms($post_id, 'product_cat');
            $cat_slugs = [];
            $is_ammo = false;
            $is_mag = false;
            if ($terms && !is_wp_error($terms)) {
                foreach ($terms as $t) {
                    $cat_slugs[] = $t->slug;
                    if ($ammo_term_id && ($t->term_id === $ammo_term_id || term_is_ancestor_of($ammo_term_id, $t->term_id, 'product_cat'))) {
                        $is_ammo = true;
                    }
                    if ($mag_term_id && ($t->term_id === $mag_term_id || term_is_ancestor_of($mag_term_id, $t->term_id, 'product_cat'))) {
                        $is_mag = true;
                    }
                }
            }

            $changed = false;

            // Brand: from meta _brand or _manufacturer, or extract from name (all products)
            $brand = $product->get_meta('_brand');
            if (!$brand) $brand = $product->get_meta('_manufacturer');
            if (!$brand) $brand = $this->extract_brand($name);
            if ($brand) {
                $changed = $this->set_product_attribute_term($product, 'pa_brand', $brand) || $changed;
            }

            // Caliber: try on all products (ammo, mags, and name-based detection)
            $caliber = $this->extract_caliber($name);
            if ($caliber) $changed = $this->set_product_attribute_term($product, 'pa_caliber', $caliber) || $changed;

            // Ammo: bullet_type, grain_weight, and Handgun/Rifle/Rimfire subcategory (ammo-specific)
            if ($is_ammo) {
                $bullet = $this->extract_bullet_type($name);
                $grain = $this->extract_grain_weight($name);
                if ($bullet) $changed = $this->set_product_attribute_term($product, 'pa_bullet_type', $bullet) || $changed;
                if ($grain)  $changed = $this->set_product_attribute_term($product, 'pa_grain_weight', $grain) || $changed;
                $ammo_type = $this->classify_ammo_type($name, $caliber);
                if ($ammo_type) $changed = $this->assign_ammo_subcategory($post_id, $ammo_type, $cat_slugs) || $changed;
            }

            // Magazines: capacity
            if ($is_mag) {
                $capacity = $this->extract_capacity($name);
                if ($capacity) $changed = $this->set_product_attribute_term($product, 'pa_capacity', $capacity) || $changed;
            }

            // Non-ammo products: still try bullet_type and grain_weight from name (e.g. "9mm 124gr FMJ")
            if (!$is_ammo) {
                $bullet = $this->extract_bullet_type($name);
                $grain = $this->extract_grain_weight($name);
                if ($bullet) $changed = $this->set_product_attribute_term($product, 'pa_bullet_type', $bullet) || $changed;
                if ($grain)  $changed = $this->set_product_attribute_term($product, 'pa_grain_weight', $grain) || $changed;
            }

            if ($changed) {
                $product->save();
                $updated++;
            } else {
                $skipped++;
            }
        }

        $log[] = "Done. Updated: $updated, Skipped: $skipped";
        update_option(self::OPTION_LAST_RUN, current_time('mysql'));
        update_option(self::OPTION_LAST_STATUS, implode("\n", $log));

        return ['updated' => $updated, 'skipped' => $skipped];
    }

    private function extract_caliber($name) {
        $patterns = [
            '.22 LR', '.22 Magnum', '.22 TCM', '.38 Special', '.357 Magnum', '.40 S&W', '.45 ACP', '.45 Colt',
            '.223', '.224', '.243', '.270', '.308', '.30-06', '.300 Win Mag', '.300 BLK', '.300 Blackout',
            '9mm', '10mm', '5.56', '5.56 NATO', '6.5 Creedmoor', '6.5 Grendel', '6mm ARC',
            '7.62x39', '7.62x39mm', '7.62x54', '7.62 NATO', '12 Gauge', '20 Gauge',
            '410', '.45-70', '.222 Remington', '.223 Rem', '.308 Win',
            '260 REMINGTON', '6.5 CREEDMOOR', '6.5 GRENDEL',
        ];
        if (!$name) return '';
        $u = strtoupper($name);
        foreach ($patterns as $p) {
            if (stripos($u, $p) !== false) return $p;
        }
        // Fallback: 7.62x39mm style
        if (preg_match('/\d+\.\d+x\d+(?:mm)?/i', $name, $m)) return $m[0];
        return '';
    }

    private function extract_bullet_type($name) {
        $map = [
            'FMJ' => ['FMJ', 'Full Metal Jacket'],
            'JHP' => ['JHP', 'Jacketed Hollow Point'],
            'HP' => ['Hollow Point', ' HP'],
            'Soft Point' => ['Soft Point', 'SP'],
            'BTHP' => ['BTHP', 'Boat Tail'],
            'Round Nose' => ['Round Nose', 'LRN', 'RN'],
            'Buckshot' => ['Buck', 'Buckshot'],
            'Slug' => ['Slug'],
        ];
        if (!$name) return '';
        $u = strtoupper($name);
        foreach ($map as $type => $patterns) {
            foreach ($patterns as $p) {
                if (stripos($u, $p) !== false) return $type;
            }
        }
        return '';
    }

    private function extract_grain_weight($name) {
        if (!preg_match('/(\d+)\s*(?:gr|grain)/i', $name ?? '', $m)) return '';
        return $m[1] . 'gr';
    }

    private function extract_capacity($name) {
        if (!preg_match('/(\d+)\s*(?:rd|rds|round|rounds|capacity|\/)/i', $name ?? '', $m)) return '';
        return $m[1] . ' rd';
    }

    private function extract_brand($name) {
        $known = ['Federal', 'Hornady', 'Remington', 'Winchester', 'CCI', 'Speer', 'Barnes', 'Nosler', 'Sig Sauer', 'Lapua', 'Norma', 'Magtech', 'PPU', 'Sellier', 'Igman', 'Global Ordnance', 'Accurate', 'Alliant', 'Hodgdon', 'IMR', 'Vihtavuori', 'Berry\'s', 'Berry'];
        if (!$name) return '';
        $u = $name;
        foreach ($known as $b) {
            if (stripos($u, $b) !== false) return $b;
        }
        return '';
    }

    /**
     * Classify ammo as handgun, rifle, or rimfire based on caliber/name.
     */
    private function classify_ammo_type($name, $caliber) {
        if (!$name) return '';
        $u = strtoupper($name);

        // Rimfire first (most specific)
        $rimfire = ['.22 LR', '.22 LONG RIFLE', '.22 MAGNUM', '.22 SHORT', '.22 LONG', '.17 HMR', '.17 WSM', '.17 HM2'];
        foreach ($rimfire as $p) {
            if (stripos($u, $p) !== false || stripos($u, str_replace(['.', ' '], '', $p)) !== false) return 'rimfire';
        }
        if (preg_match('/\.22\s*(?:LR|LONG|SHORT|MAG|WMR)|\.17\s*(?:HMR|WSM)/i', $name)) return 'rimfire';

        // Shotgun ammo
        if (preg_match('/12\s*GAUGE|20\s*GAUGE|410|28\s*GAUGE|16\s*GAUGE|BUCKSHOT|SLUG/i', $u)) return 'shotgun';

        // Handgun calibers
        $handgun = ['9MM', '10MM', '.22 TCM', '.38 SPECIAL', '.357 MAGNUM', '.40 S&W', '.45 ACP', '.45 COLT', '.380', '.380 ACP', '.32', '.25 ACP', '.44 MAGNUM', '.44 SPECIAL', '.40 S&W', '.38 SPL', '.500 S&W', '.460 S&W', '.454 CASULL'];
        foreach ($handgun as $p) {
            if (stripos($u, $p) !== false) return 'handgun';
        }
        if (preg_match('/\b9\s*mm\b|\b9mm\b|\.45\s*ACP|\.40\s*S[&]?\s*W|\.38\s*SPECIAL|\.357\s*MAG|\.380\b|\.44\s*MAG|\.32\b/i', $name)) return 'handgun';

        // Rifle calibers
        $rifle = ['.223', '.224', '.243', '.270', '.308', '.30-06', '.300 WIN MAG', '.300 BLK', '.300 BLACKOUT', '5.56', '5.56 NATO', '6.5 CREEDMOOR', '6.5 GRENDEL', '6MM ARC', '7.62X39', '7.62X54', '7.62 NATO', '.45-70', '.222', '.260', '.300', '6.5'];
        foreach ($rifle as $p) {
            if (stripos($u, $p) !== false) return 'rifle';
        }
        if (preg_match('/\d+\.\d+x\d+/i', $name)) return 'rifle';

        return '';
    }

    /**
     * Assign product to Handgun, Rifle, or Rimfire subcategory under Ammunition.
     */
    private function assign_ammo_subcategory($post_id, $ammo_type_slug, $current_cat_slugs) {
        if (!in_array($ammo_type_slug, ['handgun', 'rifle', 'rimfire', 'shotgun'], true)) return false;
        if (!taxonomy_exists('product_cat')) return false;

        $term = get_term_by('slug', $ammo_type_slug, 'product_cat');
        if (!$term || is_wp_error($term)) return false;

        $current = wp_get_object_terms($post_id, 'product_cat');
        $term_ids = [];
        $target_id = (int) $term->term_id;
        foreach ($current as $t) {
            if (in_array($t->slug, ['handgun', 'rifle', 'rimfire', 'shotgun'], true)) continue;
            $term_ids[] = (int) $t->term_id;
        }
        if (!in_array($target_id, $term_ids)) {
            $term_ids[] = $target_id;
        }
        wp_set_object_terms($post_id, $term_ids, 'product_cat');
        return true;
    }

    private function set_product_attribute_term($product, $attr_name, $value) {
        if (!$value || !$product || !is_a($product, 'WC_Product')) return false;
        $slug = sanitize_title($value);
        if (!$slug) return false;

        if (!taxonomy_exists($attr_name)) {
            $nice = ucwords(str_replace(['pa_', '_'], ['', ' '], $attr_name));
            wc_create_attribute(['name' => $nice, 'slug' => str_replace('pa_', '', $attr_name), 'has_archives' => false]);
            register_taxonomy($attr_name, 'product', [
                'labels' => ['name' => $nice],
                'hierarchical' => false,
                'show_ui' => false,
                'query_var' => true,
                'rewrite' => false,
            ]);
        }

        $term = get_term_by('slug', $slug, $attr_name);
        if (!$term) {
            $r = wp_insert_term($value, $attr_name, ['slug' => $slug]);
            if (is_wp_error($r)) return false;
            $term = get_term_by('slug', $slug, $attr_name);
        }
        if ($term && !is_wp_error($term)) {
            wp_set_object_terms($product->get_id(), [(int) $term->term_id], $attr_name);
            return true;
        }
        return false;
    }
}
