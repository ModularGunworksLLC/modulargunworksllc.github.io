<?php
/**
 * Modular Gunworks Theme Functions
 */

require_once get_template_directory() . '/includes/class-mgw-shop-filters.php';
require_once get_template_directory() . '/includes/mgw-setup-category-filters-admin.php';
require_once get_template_directory() . '/includes/class-mgw-attribute-extractor.php';
require_once get_template_directory() . '/includes/class-mgw-wc-native-compat.php';
require_once get_template_directory() . '/includes/mgw-ensure-catalog-filters.php';

function modulargunworks_enqueue_assets() {
    $theme_uri = get_template_directory_uri();

    // Design system & layout
    wp_enqueue_style('mgw-design-system', $theme_uri . '/assets/css/design-system.css', [], '1.0');
    wp_enqueue_style('mgw-components', $theme_uri . '/assets/css/components.css', ['mgw-design-system'], '1.0');
    wp_enqueue_style('mgw-layout', $theme_uri . '/assets/css/layout.css', ['mgw-components'], '1.0');
    wp_enqueue_style('mgw-age-gate', $theme_uri . '/assets/css/age-gate.css', [], '1.0');
    wp_enqueue_style('mgw-product-tiles', $theme_uri . '/assets/css/product-tiles.css', [], '1.0');
    if (is_front_page()) {
        wp_enqueue_style('mgw-front-page', $theme_uri . '/assets/css/front-page.css', ['mgw-layout'], '1.0');
    }

    // WooCommerce shop styles
    if (class_exists('WooCommerce')) {
        wp_enqueue_style('mgw-woocommerce', $theme_uri . '/assets/css/woocommerce.css', ['mgw-layout'], '3.1');
    }

    // Font Awesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', [], '6.4.0');

    // Scripts (skip cart.js when WooCommerce active - WooCommerce handles cart natively)
    if (!class_exists('WooCommerce')) {
        wp_enqueue_script('mgw-cart', $theme_uri . '/assets/js/cart.js', [], '1.0', true);
    }
    wp_enqueue_script('mgw-age-gate', $theme_uri . '/assets/js/age-gate.js', [], '1.2', true);
    wp_localize_script('mgw-age-gate', 'mgwAgeGateConfig', [
        'denyUrl'   => apply_filters('modulargunworks_age_gate_deny_url', 'https://www.google.com'),
        'expiryHours' => apply_filters('modulargunworks_age_gate_expiry_hours', 24),
    ]);

    // Cart page: age verification + checkout styling (load whenever cart could be shown)
    $is_cart_view = is_cart() || (function_exists('wc_get_page_id') && wc_get_page_id('cart') > 0 && is_page(wc_get_page_id('cart'))) || is_page('cart') || is_page_template('page-cart.php');
    if ($is_cart_view) {
        wp_enqueue_script('mgw-cart-age-gate', $theme_uri . '/assets/js/cart-age-gate.js', ['jquery'], '1.0', true);
        $cart_needs_verification = modulargunworks_cart_needs_age_verification();
        wp_localize_script('mgw-cart-age-gate', 'mgwCartAgeGate', [
            'needsVerification' => $cart_needs_verification['needs'],
            'hasFirearms' => $cart_needs_verification['firearms'],
        ]);
    }

    if (class_exists('WooCommerce') && (is_shop() || is_product_category() || is_tax('pa_brand'))) {
        wp_enqueue_script('mgw-shop-filters-ajax', $theme_uri . '/assets/js/shop-filters-ajax.js', ['jquery'], '1.2', true);
        wp_localize_script('mgw-shop-filters-ajax', 'mgwFilterVars', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
        ]);
    }
}
add_action('wp_enqueue_scripts', 'modulargunworks_enqueue_assets');

/**
 * Site-wide age gate modal — welcome / browsing acknowledgment only.
 * Legal age certification for purchases is enforced at checkout (see checkout age block below).
 */
function modulargunworks_age_gate_modal() {
    ?>
    <div id="mgw-age-gate-modal" class="age-gate-modal" aria-hidden="true" style="display:none;">
        <div class="age-gate-backdrop"></div>
        <div class="age-gate-content" role="dialog" aria-labelledby="mgw-age-gate-title" aria-modal="true">
            <div class="age-gate-header">
                <div class="age-gate-icon" aria-hidden="true"></div>
                <h1 id="mgw-age-gate-title"><?php esc_html_e('Age Verification Required', 'modulargunworks'); ?></h1>
            </div>
            <p class="age-gate-intro"><?php esc_html_e('This website sells firearms, ammunition, and related products. You must be at least 18 years of age to enter.', 'modulargunworks'); ?></p>
            <div class="age-gate-question">
                <p><?php esc_html_e('Are you 18 years of age or older?', 'modulargunworks'); ?></p>
            </div>
            <div class="age-gate-buttons">
                <button type="button" class="age-gate-btn age-gate-btn-confirm" id="mgw-age-gate-yes"><?php esc_html_e('Yes, I am 18 or older', 'modulargunworks'); ?></button>
                <button type="button" class="age-gate-btn age-gate-btn-deny" id="mgw-age-gate-no"><?php esc_html_e('No, I am under 18', 'modulargunworks'); ?></button>
            </div>
            <div class="age-gate-legal">
                <p><?php esc_html_e('Federal law requires 18+ for rifles/shotguns and ammunition; 21+ for handguns and receivers. By entering, you confirm compliance with all applicable laws.', 'modulargunworks'); ?></p>
            </div>
        </div>
    </div>
    <?php
}
add_action('wp_footer', 'modulargunworks_age_gate_modal', 1);

/**
 * Polyfill crypto.randomUUID for browsers/contexts that lack it (HTTP, older browsers, tracking.js)
 */
function modulargunworks_crypto_randomuuid_polyfill() {
    ?>
    <script>
    (function() {
        try {
            if (typeof crypto !== 'undefined' && typeof window !== 'undefined' && (!crypto.randomUUID || typeof crypto.randomUUID !== 'function')) {
                if (crypto.getRandomValues) {
                    crypto.randomUUID = function randomUUID() {
                        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c) {
                            return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
                        });
                    };
                } else {
                    crypto.randomUUID = function randomUUID() {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    };
                }
            }
        } catch (e) {}
    })();
    </script>
    <?php
}
add_action('wp_head', 'modulargunworks_crypto_randomuuid_polyfill', 1);

/**
 * CRITICAL: Prevent WordPress redirect_canonical from stripping filter params.
 * Covers WooCommerce layered nav (?filter_pa_*), Filter Everything (slug params), price, etc.
 */
function modulargunworks_disable_canonical_redirect_with_filters($redirect_url, $requested_url) {
    $filter_keys = [
        'filter_stock', 'filter_stock_status', 'min_price', 'max_price', 'orderby', 'post_type', 'per_page',
        'brand', 'caliber', 'capacity', 'bullet-type', 'grain', 'price', 'in-stock', 'firearm-type', 'on-sale', 'on_sale', 'srch',
    ];
    foreach (array_keys($_GET) as $gk) {
        $gk = (string) $gk;
        if (strpos($gk, 'filter_pa_') === 0) {
            return false;
        }
        if (in_array($gk, $filter_keys, true)) {
            return false;
        }
    }
    foreach ($filter_keys as $key) {
        if (strpos($requested_url, $key . '=') !== false) {
            return false;
        }
    }
    if (strpos($requested_url, 'filter_pa_') !== false) {
        return false;
    }
    return $redirect_url;
}
add_filter('redirect_canonical', 'modulargunworks_disable_canonical_redirect_with_filters', 10, 2);

/**
 * Parse round count from product name (for CPR display when _round_count meta not set)
 */
function modulargunworks_parse_round_count($name) {
    if (!$name) return 0;
    if (preg_match('/(\d+)\s*(?:rd|rds|round|rounds)\s*(?:\/|$)/i', $name, $m)) return (int) $m[1];
    if (preg_match('/(\d+)\s*RD\b/i', $name, $m)) return (int) $m[1];
    if (preg_match('/(\d+)\s*\/\s*(?:ct|rd|box)/i', $name, $m)) return (int) $m[1];
    if (preg_match('/\b(\d+)\s*\/\s*ct\b/i', $name, $m)) return (int) $m[1];
    if (preg_match('/\((\d+)\s*round/i', $name, $m)) return (int) $m[1];
    return 0;
}

/**
 * Filter Everything: Use category-specific Filter Sets when option 'mgw_filter_set_ids' exists.
 * Ammunition gets full filters (Caliber, Bullet Type, Grain, etc.); Magazines gets Capacity; others get Brand + Price.
 */
function modulargunworks_filter_relevant_set_by_category( $filter_sets, $queried_object ) {
    $mapping = get_option( 'mgw_filter_set_ids', [] );
    if ( empty( $mapping ) ) {
        return $filter_sets;
    }

    $set_id = null;

    if ( isset( $queried_object['taxonomy'] ) && $queried_object['taxonomy'] === 'product_cat' && ! empty( $queried_object['term_id'] ) ) {
        $term = get_term( (int) $queried_object['term_id'], 'product_cat' );
        if ( $term && ! is_wp_error( $term ) && isset( $mapping[ $term->slug ] ) ) {
            $set_id = (int) $mapping[ $term->slug ];
        }
        if ( ! $set_id && $term && ! is_wp_error( $term ) && $term->parent ) {
            $parent = get_term( $term->parent, 'product_cat' );
            if ( $parent && ! is_wp_error( $parent ) && isset( $mapping[ $parent->slug ] ) ) {
                $set_id = (int) $mapping[ $parent->slug ];
            }
        }
    } elseif ( isset( $queried_object['post_types'] ) && in_array( 'product', (array) $queried_object['post_types'], true ) ) {
        $set_id = isset( $mapping['default'] ) ? (int) $mapping['default'] : null;
    }

    if ( $set_id ) {
        return [ [ 'ID' => $set_id, 'show_on_the_page' => true ] ];
    }

    return $filter_sets;
}
add_filter( 'wpc_relevant_set_ids', 'modulargunworks_filter_relevant_set_by_category', 5, 2 );

/**
 * Fallback: Replace filter sets using current WP context (runs after default logic).
 * Handles cases where queried_object from Filter Everything lacks taxonomy/term_id.
 */
function modulargunworks_override_filter_sets_by_category( $filter_sets, $queried_object ) {
    $mapping = get_option( 'mgw_filter_set_ids', [] );
    if ( empty( $mapping ) ) {
        return $filter_sets;
    }
    $set_id = null;
    if ( is_product_category() ) {
        $term = get_queried_object();
        if ( $term && ! is_wp_error( $term ) && isset( $term->slug ) && isset( $mapping[ $term->slug ] ) ) {
            $set_id = (int) $mapping[ $term->slug ];
        }
        if ( ! $set_id && $term && ! is_wp_error( $term ) && $term->parent ) {
            $parent = get_term( $term->parent, 'product_cat' );
            if ( $parent && ! is_wp_error( $parent ) && isset( $mapping[ $parent->slug ] ) ) {
                $set_id = (int) $mapping[ $parent->slug ];
            }
        }
    } elseif ( is_shop() || is_tax( 'pa_brand' ) ) {
        $set_id = isset( $mapping['default'] ) ? (int) $mapping['default'] : null;
    }
    if ( $set_id ) {
        return [ [ 'ID' => $set_id, 'show_on_the_page' => true ] ];
    }
    return $filter_sets;
}
add_filter( 'wpc_return_relevant_set_ids', 'modulargunworks_override_filter_sets_by_category', 999, 2 );

/**
 * Fix In Stock filter: Filter Everything uses postmeta _stock_status which fails for variable products
 * (stock is on variations). Use WooCommerce's wc_product_meta_lookup instead via filter_stock_status.
 * Checks both $_GET (normal load) and flrt_ajax_link (AJAX).
 */
function modulargunworks_fix_instock_filter_for_variable_products( $query ) {
    if ( ! $query->is_main_query() || $query->get( 'post_type' ) !== 'product' ) {
        return;
    }
    $instock = isset( $_GET['in-stock'] ) ? sanitize_text_field( wp_unslash( $_GET['in-stock'] ) ) : '';
    if ( $instock === '' && ! empty( $_POST['flrt_ajax_link'] ) ) {
        $url = esc_url_raw( wp_unslash( $_POST['flrt_ajax_link'] ) );
        $parsed = wp_parse_url( $url );
        if ( ! empty( $parsed['query'] ) ) {
            parse_str( $parsed['query'], $params );
            $instock = isset( $params['in-stock'] ) ? sanitize_text_field( $params['in-stock'] ) : '';
        }
    }
    if ( $instock !== 'instock' ) {
        return;
    }
    $query->set( 'filter_stock_status', 'instock' );

    $meta_query = $query->get( 'meta_query' );
    if ( is_array( $meta_query ) ) {
        $filtered = modulargunworks_remove_stock_status_from_meta_query( $meta_query );
        if ( $filtered !== $meta_query ) {
            $query->set( 'meta_query', $filtered );
        }
    }
}
function modulargunworks_remove_stock_status_from_meta_query( $meta_query ) {
    if ( ! is_array( $meta_query ) ) {
        return $meta_query;
    }
    return array_filter( $meta_query, function ( $clause, $key ) {
        if ( $key === 'relation' ) {
            return true;
        }
        if ( is_array( $clause ) && isset( $clause['key'] ) && $clause['key'] === '_stock_status' ) {
            return false;
        }
        return true;
    }, ARRAY_FILTER_USE_BOTH );
}
add_action( 'pre_get_posts', 'modulargunworks_fix_instock_filter_for_variable_products', 10000 );

/**
 * The "Auto-Filter" Hook — reads product name and sets filter attributes (pa_caliber, pa_capacity, etc.)
 * so Filter Everything works without manual intervention or a separate backfill.
 */
// Silent attribute extractor during updates:
// - We only populate attributes on initial product creation (`woocommerce_new_product`).
// - This prevents CPU spikes during sync price/stock updates.

add_action( 'woocommerce_new_product', function ( $id ) {
    if ( ! empty( $GLOBALS['mgw_chattanooga_sync_import'] ) ) {
        return;
    }
    $id = (int) $id;
    if ( $id && function_exists( 'mgw_chattanooga_map_product_attributes_for_id' ) ) {
        mgw_chattanooga_map_product_attributes_for_id( $id );
    }
    $product = wc_get_product( $id );
    if ( $product ) {
        $extractor = new MGW_Attribute_Extractor();
        $extractor->set_attributes_from_name( $product );
    }
}, 20 );

add_action(
    'woocommerce_update_product',
    function ( $id ) {
        if ( ! empty( $GLOBALS['mgw_chattanooga_sync_import'] ) ) {
            return;
        }
        $product = wc_get_product( $id );
        if ( $product ) {
            $extractor = new MGW_Attribute_Extractor();
            $extractor->set_attributes_from_name( $product );
        }
    },
    20
);

/**
 * Inject filter sidebar into woocommerce_sidebar on shop/category pages (fallback when default template runs)
 */
function modulargunworks_sidebar_filters_fallback() {
    if (!function_exists('WC') || !(is_shop() || is_product_category() || is_tax('pa_brand'))) {
        return;
    }
    $filter_template = get_template_directory() . '/woocommerce/sidebar-shop-filters.php';
    if (file_exists($filter_template)) {
        include $filter_template;
    }
}
add_action('woocommerce_sidebar', 'modulargunworks_sidebar_filters_fallback', 5);

/**
 * Ensure shop/category pages use our layout with sidebar (flex)
 */
function modulargunworks_shop_body_class($classes) {
    if (is_shop() || is_product_category() || is_tax('pa_brand')) {
        $classes[] = 'mgw-has-shop-sidebar';
    }
    return $classes;
}
add_filter('body_class', 'modulargunworks_shop_body_class');

/**
 * Force cart page template - ensures cart content always displays (fixes empty cart page)
 */
function modulargunworks_force_cart_template($template) {
    $is_cart_page = is_cart();
    if (!$is_cart_page && function_exists('wc_get_page_id') && wc_get_page_id('cart') > 0 && is_page(wc_get_page_id('cart'))) {
        $is_cart_page = true;
    }
    if (!$is_cart_page && is_page('cart')) {
        $is_cart_page = true;
    }
    if ($is_cart_page) {
        $cart_template = get_template_directory() . '/page-cart.php';
        if (file_exists($cart_template)) {
            return $cart_template;
        }
    }
    return $template;
}
add_filter('template_include', 'modulargunworks_force_cart_template', 999);

/**
 * Redirect /product-category/brands/ to /brands/ so we always use the brand tiles page
 */
function modulargunworks_brands_redirect() {
    if (!is_product_taxonomy()) return;
    $term = get_queried_object();
    if (!$term || $term->taxonomy !== 'product_cat' || $term->slug !== 'brands') return;
    $brands_url = home_url('/brands/');
    $brands_page = get_page_by_path('brands');
    if ($brands_page) {
        $brands_url = get_permalink($brands_page);
    }
    wp_safe_redirect($brands_url, 301);
    exit;
}
add_action('template_redirect', 'modulargunworks_brands_redirect', 1);

/**
 * Force brands page to use Shop By Brand template - prevents giant image/jpg dead end.
 * Runs at very high priority to override page builders and other templates.
 */
function modulargunworks_force_brands_template($template) {
    $is_brands_page = is_page('brands') || is_page('shop-by-brand');
    $obj = get_queried_object();
    if ($obj && isset($obj->post_name) && in_array($obj->post_name, ['brands', 'shop-by-brand'])) {
        $is_brands_page = true;
    }
    $is_brands_category = false;
    if (is_product_taxonomy() && $obj && isset($obj->taxonomy) && $obj->taxonomy === 'product_cat' && isset($obj->slug) && $obj->slug === 'brands') {
        $is_brands_category = true;
    }
    if ($is_brands_page || $is_brands_category) {
        $brands_template = get_template_directory() . '/page-brands.php';
        if (file_exists($brands_template)) {
            return $brands_template;
        }
    }
    return $template;
}
add_filter('template_include', 'modulargunworks_force_brands_template', 99999);

/**
 * Fallback: Replace brands page content when default template is used (prevents giant image, shows brand tiles)
 */
function modulargunworks_brands_content_fallback($content) {
    $is_brands = is_page('brands') || is_page('shop-by-brand');
    if (!$is_brands) {
        $obj = get_queried_object();
        $is_brands = ($obj && isset($obj->post_name) && in_array($obj->post_name, ['brands', 'shop-by-brand']));
    }
    if (!$is_brands) return $content;
    $brand_terms = [];
    if (taxonomy_exists('pa_brand')) {
        $terms = get_terms([
            'taxonomy' => 'pa_brand',
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ]);
        if (!is_wp_error($terms)) {
            $brand_terms = $terms;
        }
    }
    ob_start();
    ?>
    <div class="mgw-brands-main">
      <h1 class="page-title"><?php esc_html_e('Shop by Brand', 'modulargunworks'); ?></h1>
      <p class="brands-subtitle"><?php esc_html_e('Browse our manufacturers. Click any brand to see all their products.', 'modulargunworks'); ?></p>
      <?php if (empty($brand_terms)) : ?>
      <p class="no-brands"><?php esc_html_e('No brands available yet. Add the Brand attribute to products and assign brand images in Products → Attributes → Brand.', 'modulargunworks'); ?></p>
      <?php else : ?>
      <div class="brands-grid">
        <?php foreach ($brand_terms as $term) :
            $brand_url = get_term_link($term);
            if (is_wp_error($brand_url)) continue;
            $thumb_id = get_term_meta($term->term_id, 'thumbnail_id', true);
            $img_url = $thumb_id ? wp_get_attachment_image_url($thumb_id, 'medium') : '';
        ?>
        <a href="<?php echo esc_url($brand_url); ?>" class="brand-card">
          <div class="brand-logo">
            <?php if ($img_url) : ?>
            <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr($term->name); ?>">
            <?php else : ?>
            <span class="brand-logo-placeholder"><?php echo esc_html(substr($term->name, 0, 1)); ?></span>
            <?php endif; ?>
          </div>
          <h3><?php echo esc_html($term->name); ?></h3>
          <p><?php printf(esc_html(_n('%d product', '%d products', $term->count, 'modulargunworks')), (int) $term->count); ?></p>
        </a>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_filter('the_content', 'modulargunworks_brands_content_fallback', 5);

/**
 * Force checkout page template - ensures checkout (GunTab) always displays
 */
function modulargunworks_force_checkout_template($template) {
    $is_checkout_page = is_checkout() && !is_wc_endpoint_url();
    if (!$is_checkout_page && function_exists('wc_get_page_id') && wc_get_page_id('checkout') > 0 && is_page(wc_get_page_id('checkout'))) {
        $is_checkout_page = true;
    }
    if (!$is_checkout_page && is_page('checkout')) {
        $is_checkout_page = true;
    }
    if ($is_checkout_page) {
        $checkout_template = get_template_directory() . '/page-checkout.php';
        if (file_exists($checkout_template)) {
            return $checkout_template;
        }
    }
    return $template;
}
add_filter('template_include', 'modulargunworks_force_checkout_template', 998);

/**
 * Fallback: inject cart shortcode into content when cart page has empty/wrong content
 */
function modulargunworks_cart_content_fallback($content) {
    if (!function_exists('WC')) {
        return $content;
    }
    $is_cart_page = is_cart() || (function_exists('wc_get_page_id') && is_page(wc_get_page_id('cart'))) || is_page('cart');
    if (!$is_cart_page) {
        return $content;
    }
    if (strpos($content, 'woocommerce-cart-form') !== false || strpos($content, 'cart-empty') !== false) {
        return $content;
    }
    return do_shortcode('[woocommerce_cart]');
}
add_filter('the_content', 'modulargunworks_cart_content_fallback', 5);

/**
 * Check if cart contains age-restricted items (ammunition, firearms)
 * Includes subcategories (e.g. Handgun, Rifle under Ammunition) and fallback when cart has items.
 */
function modulargunworks_cart_needs_age_verification() {
    if (!function_exists('WC') || !WC()->cart) {
        return ['needs' => false, 'firearms' => false];
    }
    $cart_count = WC()->cart->get_cart_contents_count();
    if ($cart_count === 0) {
        return ['needs' => false, 'firearms' => false];
    }

    $has_ammo = false;
    $has_firearms = false;
    $ammo_slugs = ['ammunition', 'ammo', 'handgun', 'rifle', 'shotgun', 'rimfire'];
    $firearm_slugs = ['firearms', 'guns', 'handguns', 'rifles', 'shotguns'];

    if (taxonomy_exists('product_cat')) {
        $ammo_term = get_term_by('slug', 'ammunition', 'product_cat');
        $ff_term = get_term_by('slug', 'firearms', 'product_cat');
        $guns_term = get_term_by('slug', 'guns', 'product_cat');
    } else {
        $ammo_term = $ff_term = $guns_term = null;
    }

    foreach (WC()->cart->get_cart() as $item) {
        $product = $item['data'];
        if (!$product || !is_a($product, 'WC_Product')) continue;
        $terms = get_the_terms($product->get_id(), 'product_cat');
        if (!$terms || is_wp_error($terms)) continue;
        foreach ($terms as $term) {
            $slug = strtolower($term->slug);
            if (in_array($slug, $ammo_slugs)) $has_ammo = true;
            if (in_array($slug, $firearm_slugs)) $has_firearms = true;
            if ($ammo_term && !is_wp_error($ammo_term) && ($term->term_id === $ammo_term->term_id || term_is_ancestor_of($ammo_term->term_id, $term->term_id, 'product_cat'))) {
                $has_ammo = true;
            }
            if (($ff_term && !is_wp_error($ff_term) && ($term->term_id === $ff_term->term_id || term_is_ancestor_of($ff_term->term_id, $term->term_id, 'product_cat')))
                || ($guns_term && !is_wp_error($guns_term) && ($term->term_id === $guns_term->term_id || term_is_ancestor_of($guns_term->term_id, $term->term_id, 'product_cat')))) {
                $has_firearms = true;
            }
        }
    }

    $needs = $has_ammo || $has_firearms;
    if (!$needs && $cart_count > 0) {
        $needs = (bool) apply_filters('modulargunworks_require_age_gate_when_uncategorized', true);
    }
    return ['needs' => $needs, 'firearms' => $has_firearms];
}

/**
 * Cart page: age verification block (like old site) before Proceed to Checkout
 */
function modulargunworks_cart_age_verification_block() {
    $data = modulargunworks_cart_needs_age_verification();
    if (!$data['needs']) return;
    $state_url = get_permalink(get_page_by_path('state-restrictions')) ?: home_url('/state-restrictions/');
    $ffl_url = get_permalink(get_page_by_path('firearm-transfer-guide')) ?: home_url('/firearm-transfer-guide/');
    ?>
    <div id="mgw-age-verification-block" class="mgw-age-verification-block" style="background:#f9f9f9; padding:20px; border:1px solid #ddd;">
        <div class="mgw-age-verification-notice">
            <?php if ($data['firearms']) : ?>
                <strong><?php esc_html_e('Your cart contains firearms.', 'modulargunworks'); ?></strong>
                <?php esc_html_e('Federal law requires all firearms to be shipped to a licensed FFL dealer. We cannot ship firearms to residential addresses or P.O. boxes. You must have your firearm shipped to an FFL of your choice and complete the background check (Form 4473) at the FFL. Age: 21+ for handguns/receivers, 18+ for rifles/shotguns.', 'modulargunworks'); ?>
            <?php else : ?>
                <strong><?php esc_html_e('Your cart contains ammunition.', 'modulargunworks'); ?></strong>
                <?php esc_html_e('Federal law requires you to be 18+ for rifle/shotgun ammo and 21+ for handgun/other ammo. By proceeding, you confirm you meet the applicable age requirement.', 'modulargunworks'); ?>
            <?php endif; ?>
        </div>
        <div class="mgw-age-verification-checkboxes">
            <label class="mgw-checkbox-label">
                <input type="checkbox" id="mgw-age-confirm" class="mgw-age-checkbox"> <?php esc_html_e('I confirm I meet the legal age requirement for these items (18+ for long guns/ammo, 21+ for handguns/receivers).', 'modulargunworks'); ?>
            </label>
            <label class="mgw-checkbox-label">
                <input type="checkbox" id="mgw-state-ack" class="mgw-age-checkbox">
                <?php printf(wp_kses(__('I have read and acknowledge the <a href="%s" target="_blank" rel="noopener">State Ammunition & Firearm Restrictions</a> and understand that I am responsible for complying with my state\'s laws.', 'modulargunworks'), ['a' => ['href' => [], 'target' => [], 'rel' => []]]), esc_url($state_url)); ?>
            </label>
            <?php if ($data['firearms']) : ?>
            <label class="mgw-checkbox-label">
                <input type="checkbox" id="mgw-ffl-ack" class="mgw-age-checkbox"> <?php esc_html_e('I understand that my firearm(s) must be shipped to a licensed FFL dealer. I cannot receive firearms at my home address. I will provide a valid FFL for shipment.', 'modulargunworks'); ?>
            </label>
            <label class="mgw-checkbox-label">
                <input type="checkbox" id="mgw-rules-ack" class="mgw-age-checkbox">
                <?php printf(wp_kses(__('I have read and acknowledge the <a href="%s" target="_blank" rel="noopener">Federal & State Firearm Transfer Guide</a> and confirm I am of legal age and eligible to purchase.', 'modulargunworks'), ['a' => ['href' => [], 'target' => [], 'rel' => []]]), esc_url($ffl_url)); ?>
            </label>
            <?php endif; ?>
        </div>
        <p class="mgw-age-verification-hint" id="mgw-age-hint">
            <?php echo $data['firearms'] ? esc_html__('Please check all 4 boxes.', 'modulargunworks') : esc_html__('Please check both boxes.', 'modulargunworks'); ?>
        </p>
    </div>
    <script>
    (function(){
        function mgwDisableCheckout() {
            if (sessionStorage.getItem('mgw_age_verified_at_checkout')) return;
            var s = ['a.checkout-button', '.wc-proceed-to-checkout a', 'a.button[href*="checkout"]', '.cart_totals a[href*="checkout"]', '.woocommerce-cart a.button[href*="checkout"]'];
            for (var i = 0; i < s.length; i++) {
                try {
                    var list = document.querySelectorAll(s[i]);
                    for (var j = 0; j < list.length; j++) {
                        var b = list[j];
                        b.style.pointerEvents = 'none';
                        b.style.opacity = '0.5';
                        b.style.cursor = 'not-allowed';
                        b.classList.add('mgw-checkout-disabled');
                    }
                } catch(e) {}
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mgwDisableCheckout);
        } else {
            mgwDisableCheckout();
        }
        setTimeout(mgwDisableCheckout, 50);
        setTimeout(mgwDisableCheckout, 300);
    })();
    </script>
    <?php
}
add_action('woocommerce_proceed_to_checkout', 'modulargunworks_cart_age_verification_block', 5);

/**
 * Cart: use Chattanooga CDN image when available
 */
function modulargunworks_cart_item_thumbnail($thumbnail, $cart_item, $cart_item_key) {
    $product = $cart_item['data'];
    if (!$product || !is_a($product, 'WC_Product')) return $thumbnail;
    return $product->get_image('woocommerce_thumbnail');
}
add_filter('woocommerce_cart_item_thumbnail', 'modulargunworks_cart_item_thumbnail', 10, 3);

/**
 * Resolve Chattanooga CDN image URL for a product (self, parent, or first variation with meta).
 *
 * @param WC_Product $product
 * @return string Non-empty URL or ''.
 */
function modulargunworks_get_chattanooga_image_url( $product ) {
    if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
        return '';
    }
    $url = $product->get_meta( '_chattanooga_image_url' );
    if ( is_string( $url ) && $url !== '' ) {
        return $url;
    }
    $parent_id = (int) $product->get_parent_id();
    if ( $parent_id > 0 ) {
        $parent = wc_get_product( $parent_id );
        if ( $parent ) {
            $url = $parent->get_meta( '_chattanooga_image_url' );
            if ( is_string( $url ) && $url !== '' ) {
                return $url;
            }
        }
    }
    if ( $product->is_type( 'variable' ) ) {
        foreach ( $product->get_children() as $child_id ) {
            $child = wc_get_product( (int) $child_id );
            if ( ! $child ) {
                continue;
            }
            $url = $child->get_meta( '_chattanooga_image_url' );
            if ( is_string( $url ) && $url !== '' ) {
                return $url;
            }
        }
    }
    return '';
}

/**
 * Attachment ID configured under WooCommerce → Settings → Products → Placeholder image.
 */
function modulargunworks_is_wc_placeholder_attachment_id( $attachment_id ) {
    $aid = (int) $attachment_id;
    if ( $aid <= 0 ) {
        return false;
    }
    $opt = (int) get_option( 'woocommerce_placeholder_image', 0 );
    return $opt > 0 && $aid === $opt;
}

/**
 * Chattanooga CDN should replace WC output (missing image, or featured image is the store placeholder).
 *
 * @param WC_Product $product
 * @param string     $image_html
 */
function modulargunworks_product_needs_chattanooga_image_fallback( $product, $image_html ) {
    if ( ! $product instanceof WC_Product ) {
        return false;
    }
    if ( modulargunworks_get_chattanooga_image_url( $product ) === '' ) {
        return false;
    }
    $id = (int) $product->get_image_id();
    if ( $id <= 0 ) {
        return true;
    }
    if ( modulargunworks_is_wc_placeholder_attachment_id( $id ) ) {
        return true;
    }
    if ( is_string( $image_html ) && strpos( $image_html, 'woocommerce-placeholder' ) !== false ) {
        return true;
    }
    return false;
}

/**
 * Shop, widgets, etc.: use Chattanooga CDN when there is no WordPress attachment image.
 */
function modulargunworks_product_get_image_chattanooga( $image, $product, $size, $attr, $placeholder, $image_dup ) {
    unset( $placeholder, $image_dup, $size );
    if ( ! $product instanceof WC_Product ) {
        return $image;
    }
    if ( ! modulargunworks_product_needs_chattanooga_image_fallback( $product, $image ) ) {
        return $image;
    }
    $url = modulargunworks_get_chattanooga_image_url( $product );
    if ( $url === '' ) {
        return $image;
    }
    $url = esc_url( $url );
    if ( $url === '' ) {
        return $image;
    }
    $class = 'wp-post-image chattanooga-cdn-image attachment-woocommerce_thumbnail';
    if ( is_array( $attr ) && ! empty( $attr['class'] ) ) {
        $class .= ' ' . $attr['class'];
    }
    $alt = $product->get_name();
    if ( is_array( $attr ) && isset( $attr['alt'] ) && $attr['alt'] !== '' ) {
        $alt = $attr['alt'];
    }
    return sprintf(
        '<img src="%s" alt="%s" class="%s" loading="lazy" decoding="async" sizes="(max-width: 300px) 100vw, 300px" />',
        $url,
        esc_attr( (string) $alt ),
        esc_attr( trim( $class ) )
    );
}
add_filter( 'woocommerce_product_get_image', 'modulargunworks_product_get_image_chattanooga', 10, 6 );

/**
 * Single product gallery main image: same CDN fallback when there is no featured attachment.
 */
function modulargunworks_single_product_image_thumbnail_html_chattanooga( $html, $post_thumbnail_id ) {
    global $product;
    if ( ! $product instanceof WC_Product ) {
        return $html;
    }
    $url = modulargunworks_get_chattanooga_image_url( $product );
    if ( $url === '' ) {
        return $html;
    }
    $tid = (int) $post_thumbnail_id;
    $replace = ( $tid <= 0 )
        || modulargunworks_is_wc_placeholder_attachment_id( $tid )
        || ( strpos( (string) $html, 'woocommerce-placeholder' ) !== false );
    if ( ! $replace ) {
        return $html;
    }
    $url = esc_url( $url );
    if ( $url === '' ) {
        return $html;
    }
    $wrapper_classname = $product->is_type( 'variable' ) && ! empty( $product->get_visible_children() ) && '' !== $product->get_price()
        ? 'woocommerce-product-gallery__image woocommerce-product-gallery__image--placeholder'
        : 'woocommerce-product-gallery__image--placeholder';
    return sprintf(
        '<div class="%1$s"><img src="%2$s" alt="%3$s" class="wp-post-image chattanooga-cdn-image" loading="lazy" decoding="async" /></div>',
        esc_attr( $wrapper_classname ),
        $url,
        esc_attr( $product->get_name() )
    );
}
add_filter( 'woocommerce_single_product_image_thumbnail_html', 'modulargunworks_single_product_image_thumbnail_html_chattanooga', 10, 2 );

/**
 * ---------------------------------------------------------------------------
 * Checkout: dynamic age certification (server-enforced; order meta for audits)
 * Welcome modal uses a cookie only — checkout checkbox + validation is the hard block.
 * ---------------------------------------------------------------------------
 */

/**
 * WooCommerce root product ID (parent for variations).
 *
 * @param WC_Product $product
 * @return int
 */
function modulargunworks_checkout_age_root_product_id($product) {
    if (!$product || !is_a($product, 'WC_Product')) {
        return 0;
    }
    return $product->get_parent_id() ? (int) $product->get_parent_id() : (int) $product->get_id();
}

/**
 * Collect product_cat slugs for a product (variation → parent), including ancestors.
 *
 * @param int $product_id WooCommerce product or variation ID.
 * @return string[]
 */
function modulargunworks_get_product_cat_slugs_with_ancestors($product_id) {
    $product_id = (int) $product_id;
    if ($product_id <= 0 || !taxonomy_exists('product_cat')) {
        return [];
    }
    $product = wc_get_product($product_id);
    if ($product && $product->get_parent_id()) {
        $product_id = (int) $product->get_parent_id();
    }
    $terms = get_the_terms($product_id, 'product_cat');
    if (!$terms || is_wp_error($terms)) {
        return [];
    }
    $slugs = [];
    foreach ($terms as $term) {
        $slugs[] = $term->slug;
        foreach (get_ancestors((int) $term->term_id, 'product_cat') as $ancestor_id) {
            $a = get_term((int) $ancestor_id, 'product_cat');
            if ($a && !is_wp_error($a)) {
                $slugs[] = $a->slug;
            }
        }
    }
    return array_values(array_unique(array_map('strtolower', $slugs)));
}

/**
 * Category slugs that require 21+ at checkout (strictest wins in mixed carts).
 *
 * @return string[]
 */
function modulargunworks_checkout_age_21_category_slugs() {
    return apply_filters('modulargunworks_checkout_age_21_category_slugs', [
        'handguns',
        'handgun',
        'receivers',
        'receiver',
        'frames',
        'frame',
        'lowers',
        'handgun-magazines',
        'pistols',
        'pistol',
        'revolvers',
        'revolver',
    ]);
}

/**
 * Category slugs that require 18+ at checkout (only when no 21+ slug matched).
 *
 * @return string[]
 */
function modulargunworks_checkout_age_18_category_slugs() {
    return apply_filters('modulargunworks_checkout_age_18_category_slugs', [
        'rifles',
        'rifle',
        'shotguns',
        'shotgun',
        'rimfire',
    ]);
}

/**
 * Broad buckets: if sync only assigned top-level terms, keyword scan still runs on name/tags.
 *
 * @return string[]
 */
function modulargunworks_checkout_age_broad_category_slugs() {
    return apply_filters('modulargunworks_checkout_age_broad_category_slugs', [
        'firearms',
        'guns',
        'ammunition',
        'ammo',
        'magazines',
        'gun-parts',
    ]);
}

/**
 * Single lowercase string: name, descriptions, all category slugs/names, product_tag slugs/names.
 *
 * @param WC_Product $product
 * @param int        $root_id
 * @return string
 */
function modulargunworks_checkout_age_haystack($product, $root_id) {
    $parts = [];
    $parts[] = $product->get_name();
    $parts[] = $product->get_short_description();
    $parts[] = wp_strip_all_tags((string) $product->get_description());

    if (taxonomy_exists('product_cat')) {
        $terms = get_the_terms($root_id, 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            foreach ($terms as $term) {
                $parts[] = $term->slug;
                $parts[] = $term->name;
            }
        }
    }
    if (taxonomy_exists('product_tag')) {
        $tags = get_the_terms($root_id, 'product_tag');
        if ($tags && !is_wp_error($tags)) {
            foreach ($tags as $term) {
                $parts[] = $term->slug;
                $parts[] = $term->name;
            }
        }
    }

    $blob = strtolower(wp_strip_all_tags(implode(' ', array_filter($parts))));
    return preg_replace('/\s+/u', ' ', $blob);
}

/**
 * True when text suggests long-gun lower / receiver (18+ path per SME table).
 *
 * @param string $haystack Lowercased single-line blob.
 * @return bool
 */
function modulargunworks_checkout_is_rifle_shotgun_lower_context($haystack) {
    $has_long_gun = (bool) preg_match('/\b(rifle|shotgun|shotguns|rifles)\b/u', $haystack)
        || (bool) preg_match('/\b(ar[\s\-]*15|ar[\s\-]*10|ar15|ar10)\b/u', $haystack);
    $has_lower = (bool) preg_match('/\b(lower\s+receiver|stripped\s+lower|\breceiver\b|\blower\b)\b/u', $haystack);
    return $has_long_gun && $has_lower;
}

/**
 * Handgun family in name/category/tag blob.
 *
 * @param string $haystack
 * @return bool
 */
function modulargunworks_checkout_haystack_handgun_family($haystack) {
    return (bool) preg_match('/\b(handgun|handguns|pistol|pistols|revolver|revolvers)\b/u', $haystack);
}

/**
 * Product appears ammunition-related (category or wording).
 *
 * @param string[] $cat_slugs
 * @param string   $haystack
 * @return bool
 */
function modulargunworks_checkout_is_ammunition_context($cat_slugs, $haystack) {
    $ammo_slugs = ['ammunition', 'ammo', 'handgun', 'rifle', 'rimfire', 'shotgun', 'shotshell', 'shells'];
    foreach ($cat_slugs as $slug) {
        if (in_array($slug, $ammo_slugs, true)) {
            return true;
        }
    }
    return (bool) preg_match('/\b(ammunition|ammo|rounds?|cartridge|shotshell|shells?|buckshot|birdshot|slug)\b/u', $haystack);
}

/**
 * Regex fragment: rimfire / shotshell patterns → 18+ ammunition path.
 *
 * @return string
 */
function modulargunworks_checkout_age_regex_rimfire_shotgun_shells() {
    return apply_filters(
        'modulargunworks_checkout_age_regex_rimfire_shotgun',
        '\b(rimfire|22[\s\.\-]*lr|\.22[\s\.\-]*lr|\.22[\s\.\-]*long\s*rifle|\.17[\s\.\-]*hmr|\.22[\s\.\-]*wmr|\.17[\s\.\-]*hm2)'
        . '|(\b(12|16|20|28|410)\s*(ga|gauge)\b|\bshotgun\s+shell|\bshotshell|\bbirdshot|\bbuckshot\b|\b12ga\b|\b20ga\b)'
    );
}

/**
 * Regex fragment: typical centerfire handgun calibers → 21+ when selling as ammo.
 *
 * @return string
 */
function modulargunworks_checkout_age_regex_handgun_centerfire_calibers() {
    return apply_filters(
        'modulargunworks_checkout_age_regex_handgun_caliber',
        '\b(9[\s\-]*mm|9mm|9x19|9x18|\.380\b|380\s*auto|\.380\s*acp|\.38\s*spl|\.38\s*special|\.357\b|\.40\b|\.40\s*s&w|\.40\s*s\s*&\s*w|\.45\s*acp|\.45\s*auto|10mm|\.44\s*mag|\.44\s*magnum|\.32\s*acp|\.25\s*acp|\.38\s*super)\b'
    );
}

/**
 * Regex fragment: common rifle calibers (centerfire rifle ammo → 18+ when not caught as handgun).
 *
 * @return string
 */
function modulargunworks_checkout_age_regex_rifle_calibers() {
    return apply_filters(
        'modulargunworks_checkout_age_regex_rifle_caliber',
        '\b(\.223|5\.56|556\s*nat|5\.56\s*nat|\.308|7\.62\s*x\s*39|7\.62x39|6\.5\s*creed|6\.5\s*creedmoor|6mm\s*arc|\.30[\s\-]*06|\.270\b|\.243\b|\.300\s*blk|300\s*blackout)\b'
    );
}

/**
 * Receiver / frame style items → 21+ unless clearly rifle/shotgun lower context.
 *
 * @param string $haystack
 * @return bool
 */
function modulargunworks_checkout_haystack_ffl_receiver_frame_21($haystack) {
    if (modulargunworks_checkout_is_rifle_shotgun_lower_context($haystack)) {
        return false;
    }
    if ((bool) preg_match('/\b(lower\s+receiver|stripped\s+lower)\b/u', $haystack)) {
        return true;
    }
    if ((bool) preg_match('/\b(ffl|firearm|handgun|pistol|revolver)\b/u', $haystack)
        && (bool) preg_match('/\b(frame|frames|receiver|receivers)\b/u', $haystack)) {
        return true;
    }
    return false;
}

/**
 * Resolve the Chattanooga CSV category_key for a cart line item.
 *
 * Expected meta key:
 * - `_category_key` (e.g., `Firearms|Handguns`, `Ammunition|Rifle Ammunition`)
 *
 * @param WC_Product $product
 * @return string Empty when missing.
 */
function modulargunworks_checkout_get_category_key_meta($product) {
    if (!$product || !is_a($product, 'WC_Product')) {
        return '';
    }
    $key = (string) $product->get_meta('_category_key');
    $key = trim($key);
    if ($key !== '') {
        return $key;
    }

    // Variations: fall back to the parent product meta.
    $parent_id = (int) $product->get_parent_id();
    if ($parent_id > 0) {
        $parent = wc_get_product($parent_id);
        if ($parent && is_a($parent, 'WC_Product')) {
            $pkey = trim((string) $parent->get_meta('_category_key'));
            if ($pkey !== '') {
                return $pkey;
            }
        }
    }

    return '';
}

/**
 * Industry-standard mapping from CSV `category_key` to required age.
 *
 * Rules:
 * - Firearms|Rifles or Firearms|Shotguns => 18+
 * - Firearms|* (anything else, including handguns/receivers) => 21+
 * - Ammunition|Rifle Ammunition, Rimfire Ammunition, Shotgun Ammunition => 18+
 * - Ammunition|* (anything else, including handgun ammo) => 21+
 *
 * @param string $category_key
 * @return int 0, 18, or 21
 */
function modulargunworks_checkout_age_required_from_category_key($category_key) {
    $key = trim((string) $category_key);
    if ($key === '') {
        return 0;
    }
    $lc = strtolower($key);

    if (strpos($lc, 'firearms|') === 0) {
        if ($lc === strtolower('Firearms|Rifles') || $lc === strtolower('Firearms|Shotguns')) {
            return 18;
        }
        // Catch-all: any firearm not explicitly Rifle/Shotgun => 21+ (handguns, receivers, etc.).
        return 21;
    }

    if (strpos($lc, 'ammunition|') === 0) {
        $ammo_18 = [
            strtolower('Ammunition|Rifle Ammunition'),
            strtolower('Ammunition|Rimfire Ammunition'),
            strtolower('Ammunition|Shotgun Ammunition'),
        ];
        if (in_array($lc, $ammo_18, true)) {
            return 18;
        }
        // Catch-all: any other ammunition category => 21+ (e.g., handgun ammo).
        return 21;
    }

    return 0;
}

/**
 * Deep-scan minimum age for one line item (0 = no restricted signal).
 * Evaluates 21+ rules before 18+; mixed cart maximum is applied in cart helper.
 *
 * @param WC_Product|null $product
 * @return int 0, 18, or 21
 */
function modulargunworks_line_item_checkout_minimum_age($product) {
    if (!$product || !is_a($product, 'WC_Product')) {
        return 0;
    }

    // Industry-standard path: exact CSV category_key mapping.
    $category_key = modulargunworks_checkout_get_category_key_meta($product);
    if ($category_key !== '') {
        return modulargunworks_checkout_age_required_from_category_key($category_key);
    }

    $root_id = modulargunworks_checkout_age_root_product_id($product);
    $cat_slugs = modulargunworks_get_product_cat_slugs_with_ancestors($product->get_id());
    $haystack = modulargunworks_checkout_age_haystack($product, $root_id);

    $age21_slugs = array_map('strtolower', modulargunworks_checkout_age_21_category_slugs());
    $age18_slugs = array_map('strtolower', modulargunworks_checkout_age_18_category_slugs());

    foreach ($cat_slugs as $slug) {
        if (in_array($slug, $age21_slugs, true)) {
            return 21;
        }
    }

    if (modulargunworks_checkout_haystack_handgun_family($haystack)) {
        return 21;
    }

    if (modulargunworks_checkout_haystack_ffl_receiver_frame_21($haystack)) {
        return 21;
    }

    if (modulargunworks_checkout_is_ammunition_context($cat_slugs, $haystack)) {
        $rimshot = modulargunworks_checkout_age_regex_rimfire_shotgun_shells();
        if ($rimshot !== '' && (bool) preg_match('/' . $rimshot . '/iu', $haystack)) {
            return 18;
        }
        $hc = modulargunworks_checkout_age_regex_handgun_centerfire_calibers();
        if ($hc !== '' && (bool) preg_match('/' . $hc . '/iu', $haystack)) {
            return 21;
        }
        $rc = modulargunworks_checkout_age_regex_rifle_calibers();
        if ($rc !== '' && (bool) preg_match('/' . $rc . '/iu', $haystack)) {
            return 18;
        }
    }

    foreach ($cat_slugs as $slug) {
        if (in_array($slug, $age18_slugs, true)) {
            return 18;
        }
    }

    if (modulargunworks_checkout_is_rifle_shotgun_lower_context($haystack)) {
        return 18;
    }

    if ((bool) preg_match('/\b(rifle|shotgun|shotguns|rifles)\b/u', $haystack)
        && ! modulargunworks_checkout_haystack_handgun_family($haystack)) {
        return 18;
    }

    $broad = modulargunworks_checkout_age_broad_category_slugs();
    foreach ($cat_slugs as $slug) {
        if (in_array($slug, $broad, true)) {
            if (modulargunworks_checkout_haystack_handgun_family($haystack)) {
                return 21;
            }
            if ((bool) preg_match('/\b(rifle|shotgun)\b/u', $haystack)) {
                return 18;
            }
            return 21;
        }
    }

    return 0;
}

/**
 * Highest checkout age requirement for the current cart (21 beats 18).
 *
 * @return int 0, 18, or 21
 */
function modulargunworks_cart_checkout_required_age() {
    if (!function_exists('WC') || !WC()->cart) {
        return 0;
    }
    $max = 0;
    foreach (WC()->cart->get_cart() as $item) {
        $product = isset($item['data']) ? $item['data'] : null;
        $req = modulargunworks_line_item_checkout_minimum_age($product);
        $max = max($max, $req);
    }
    return (int) apply_filters('modulargunworks_cart_checkout_required_age', $max, WC()->cart);
}

/**
 * Highest checkout age requirement for a placed order (cart is empty after checkout).
 *
 * @param WC_Order $order
 * @return int
 */
function modulargunworks_order_checkout_required_age($order) {
    if (!$order || !is_a($order, 'WC_Order')) {
        return 0;
    }
    $max = 0;
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $req = modulargunworks_line_item_checkout_minimum_age($product);
        $max = max($max, $req);
    }
    return (int) apply_filters('modulargunworks_order_checkout_required_age', $max, $order);
}

/**
 * Human-readable certification label for a given minimum age.
 *
 * @param int $age 18 or 21
 * @return string
 */
function modulargunworks_checkout_age_certification_label($age) {
    if ($age === 21) {
        return __('I certify that I am 21 years of age or older and am legally allowed to purchase the restricted items in my cart.', 'modulargunworks');
    }
    if ($age === 18) {
        return __('I certify that I am 18 years of age or older and am legally allowed to purchase the restricted items in my cart.', 'modulargunworks');
    }
    return '';
}

/**
 * Output mandatory age certification checkbox before Place order.
 */
function modulargunworks_checkout_age_certification_field() {
    $req = modulargunworks_cart_checkout_required_age();
    if ($req < 18) {
        return;
    }
    $label = modulargunworks_checkout_age_certification_label($req);
    if ($label === '') {
        return;
    }
    echo '<div class="mgw-checkout-age-cert-wrap">';
    woocommerce_form_field('mgw_checkout_age_cert', [
        'type' => 'checkbox',
        'class' => ['form-row', 'input-checkbox', 'mgw-checkout-age-cert'],
        'label' => $label,
        'label_class' => ['woocommerce-form__label', 'woocommerce-form__label-for-checkbox', 'checkbox'],
        'input_class' => ['woocommerce-form__input', 'woocommerce-form__input-checkbox', 'input-checkbox'],
        'required' => true,
    ], isset($_POST['mgw_checkout_age_cert']) ? 1 : 0);
    echo '</div>';
}
add_action('woocommerce_review_order_before_submit', 'modulargunworks_checkout_age_certification_field', 5);

/**
 * Hard server-side block (action-based) if certification is missing.
 */
function modulargunworks_checkout_process_age_certification() {
    if (!function_exists('WC') || !WC()->cart) {
        return;
    }
    $req = 0;
    foreach (WC()->cart->get_cart() as $item) {
        $product = isset($item['data']) ? $item['data'] : null;
        if (!$product || !is_a($product, 'WC_Product')) {
            continue;
        }

        $category_key = modulargunworks_checkout_get_category_key_meta($product);
        if ($category_key !== '') {
            $req = max($req, modulargunworks_checkout_age_required_from_category_key($category_key));
        } else {
            // Fallback when `_category_key` isn't present yet.
            $req = max($req, modulargunworks_line_item_checkout_minimum_age($product));
        }
    }

    if ($req < 18) {
        return;
    }

    $posted = isset($_POST['mgw_checkout_age_cert']) ? sanitize_text_field(wp_unslash($_POST['mgw_checkout_age_cert'])) : '';
    if ($posted !== '1') {
        wc_add_notice(__('Please confirm the age certification above to place this order.', 'modulargunworks'), 'error');
    }
}
add_action('woocommerce_checkout_process', 'modulargunworks_checkout_process_age_certification', 10);

/**
 * Persist certification to order meta for Bound Book / audit trail.
 *
 * @param int   $order_id Order ID.
 * @param array $data     Posted checkout data.
 */
function modulargunworks_save_checkout_age_certification_order_meta($order_id, $data) {
    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }
    $req = modulargunworks_order_checkout_required_age($order);
    if ($req < 18) {
        return;
    }
    $posted = isset($_POST['mgw_checkout_age_cert']) ? sanitize_text_field(wp_unslash($_POST['mgw_checkout_age_cert'])) : '';
    if ($posted !== '1') {
        return;
    }
    $label = modulargunworks_checkout_age_certification_label($req);
    $order->update_meta_data('_mgw_age_certification_checked', 'yes');
    $order->update_meta_data('_mgw_age_certification_required_minimum', (string) $req);
    $order->update_meta_data('_mgw_age_certification_label', $label);
    $order->update_meta_data('_mgw_age_certification_at', current_time('mysql'));
    $order->save();

    $at_display = $order->get_meta('_mgw_age_certification_at');
    $note = sprintf(
        'Age Verified at Checkout: %d+ - User Attested on %s',
        (int) $req,
        $at_display ? $at_display : current_time('mysql')
    );
    $order->add_order_note($note, false, false);
}
add_action('woocommerce_checkout_update_order_meta', 'modulargunworks_save_checkout_age_certification_order_meta', 10, 2);

/**
 * Show age certification meta in admin order screen (read-only audit aid).
 *
 * @param WC_Order $order
 */
function modulargunworks_admin_order_age_certification_display($order) {
    if (!$order || !is_a($order, 'WC_Order')) {
        return;
    }
    if ($order->get_meta('_mgw_age_certification_checked') !== 'yes') {
        return;
    }
    $min = $order->get_meta('_mgw_age_certification_required_minimum');
    $at = $order->get_meta('_mgw_age_certification_at');
    echo '<p><strong>' . esc_html__('Age certification (checkout)', 'modulargunworks') . '</strong><br>';
    echo esc_html(sprintf(
        /* translators: 1: minimum age, 2: datetime */
        __('Customer certified %1$s+ at checkout. Recorded: %2$s', 'modulargunworks'),
        $min ?: '—',
        $at ?: '—'
    ));
    $label = $order->get_meta('_mgw_age_certification_label');
    if ($label !== '') {
        echo '<br><em style="font-size:12px;">' . esc_html($label) . '</em>';
    }
    echo '</p>';
}
add_action('woocommerce_admin_order_data_after_billing_address', 'modulargunworks_admin_order_age_certification_display', 15, 1);

function modulargunworks_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
    register_nav_menus(['primary' => 'Primary Menu']);
}
add_action('after_setup_theme', 'modulargunworks_theme_setup');

/**
 * Ensure Cart and Checkout pages have correct shortcodes (runs on theme activation)
 */
function modulargunworks_ensure_woocommerce_pages() {
    if (!function_exists('wc_get_page_id')) {
        return;
    }
    $cart_id = wc_get_page_id('cart');
    $checkout_id = wc_get_page_id('checkout');
    if ($cart_id && $cart_id > 0) {
        $cart_page = get_post($cart_id);
        if ($cart_page && $cart_page->post_status === 'publish') {
            $content = $cart_page->post_content;
            if (empty(trim($content)) || strpos($content, 'woocommerce_cart') === false) {
                wp_update_post([
                    'ID' => $cart_id,
                    'post_content' => '[woocommerce_cart]',
                    'post_status' => 'publish',
                ]);
            }
        }
    }
    if ($checkout_id && $checkout_id > 0) {
        $checkout_page = get_post($checkout_id);
        if ($checkout_page && $checkout_page->post_status === 'publish') {
            $content = $checkout_page->post_content;
            if (empty(trim($content)) || strpos($content, 'woocommerce_checkout') === false) {
                wp_update_post([
                    'ID' => $checkout_id,
                    'post_content' => '[woocommerce_checkout]',
                    'post_status' => 'publish',
                ]);
            }
        }
    }
}
add_action('after_switch_theme', 'modulargunworks_ensure_woocommerce_pages');

/**
 * Self-heal Cart/Checkout pages when admin visits (fixes empty pages without theme switch)
 */
function modulargunworks_maybe_fix_woocommerce_pages() {
    if (!is_admin() || !current_user_can('manage_options')) {
        return;
    }
    if (get_transient('mgw_wc_pages_checked')) {
        return;
    }
    modulargunworks_ensure_woocommerce_pages();
    set_transient('mgw_wc_pages_checked', true, DAY_IN_SECONDS);
}
add_action('admin_init', 'modulargunworks_maybe_fix_woocommerce_pages', 5);

/**
 * Admin: "Fix Cart & Checkout" action - run on demand
 */
function modulargunworks_admin_fix_cart_checkout() {
    if (!isset($_GET['mgw_fix_cart']) || $_GET['mgw_fix_cart'] !== '1' || !current_user_can('manage_options')) {
        return;
    }
    if (!wp_verify_nonce(isset($_GET['_wpnonce']) ? $_GET['_wpnonce'] : '', 'mgw_fix_cart')) {
        wp_die(__('Security check failed.', 'modulargunworks'));
    }
    delete_transient('mgw_wc_pages_checked');
    modulargunworks_ensure_woocommerce_pages();
    wp_safe_redirect(add_query_arg('mgw_cart_fixed', '1', admin_url('admin.php?page=mgw-fix-cart')));
    exit;
}
add_action('admin_init', 'modulargunworks_admin_fix_cart_checkout', 1);

/**
 * Admin: Add "Fix Cart & Checkout" under Tools menu (always visible)
 */
function modulargunworks_add_fix_cart_menu() {
    if (!current_user_can('manage_options')) {
        return;
    }
    add_management_page(
        __('Fix Cart & Checkout', 'modulargunworks'),
        __('Fix Cart & Checkout', 'modulargunworks'),
        'manage_options',
        'mgw-fix-cart',
        'modulargunworks_fix_cart_admin_page'
    );
}
add_action('admin_menu', 'modulargunworks_add_fix_cart_menu', 99);

function modulargunworks_fix_cart_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $fixed = false;
    if (isset($_GET['do_fix']) && $_GET['do_fix'] === '1' && wp_verify_nonce(isset($_GET['_wpnonce']) ? $_GET['_wpnonce'] : '', 'mgw_fix_cart')) {
        delete_transient('mgw_wc_pages_checked');
        modulargunworks_ensure_woocommerce_pages();
        $fixed = true;
    }
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Fix Cart & Checkout Pages', 'modulargunworks'); ?></h1>
        <?php if ($fixed) : ?>
            <div class="notice notice-success"><p><?php esc_html_e('Cart and Checkout pages have been updated. Visit your cart to verify.', 'modulargunworks'); ?></p></div>
        <?php endif; ?>
        <p><?php esc_html_e('If your cart page shows only "CART" with no products or checkout button, this will fix it by setting the correct shortcodes on your Cart and Checkout pages.', 'modulargunworks'); ?></p>
        <p>
            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=mgw-fix-cart&do_fix=1'), 'mgw_fix_cart', '_wpnonce')); ?>" class="button button-primary button-large">
                <?php esc_html_e('Fix Cart & Checkout Pages', 'modulargunworks'); ?>
            </a>
        </p>
        <p class="description"><?php esc_html_e('This updates the Cart page with [woocommerce_cart] and the Checkout page with [woocommerce_checkout].', 'modulargunworks'); ?></p>
    </div>
    <?php
}

/**
 * Admin notice: Fix Cart & Checkout link (also show in Dashboard for visibility)
 */
function modulargunworks_admin_cart_fix_notice() {
    if (!current_user_can('manage_options')) {
        return;
    }
    if (isset($_GET['mgw_cart_fixed'])) {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Cart and Checkout pages have been updated with the correct shortcodes.', 'modulargunworks') . '</p></div>';
        return;
    }
    if (!function_exists('wc_get_page_id')) {
        return;
    }
    $cart_id = wc_get_page_id('cart');
    $cart_ok = ($cart_id > 0 && get_post($cart_id) && strpos(get_post($cart_id)->post_content, 'woocommerce_cart') !== false);
    $checkout_id = wc_get_page_id('checkout');
    $checkout_ok = ($checkout_id > 0 && get_post($checkout_id) && strpos(get_post($checkout_id)->post_content, 'woocommerce_checkout') !== false);
    if ($cart_ok && $checkout_ok) {
        return;
    }
    $fix_url = admin_url('admin.php?page=mgw-fix-cart');
    echo '<div class="notice notice-warning"><p><strong>' . esc_html__('Cart page needs setup:', 'modulargunworks') . '</strong> ' . esc_html__('Your cart may be showing blank. ', 'modulargunworks') . '<a href="' . esc_url($fix_url) . '" class="button button-primary" style="margin-left:8px;">' . esc_html__('Fix Cart & Checkout', 'modulargunworks') . '</a></p></div>';
}
add_action('admin_notices', 'modulargunworks_admin_cart_fix_notice');

/**
 * High-priority warning when Chattanooga sync has not completed recently.
 * Uses mgw_chattanooga_last_sync (stored as datetime string).
 */
function modulargunworks_chattanooga_sync_stale_notice() {
    if (!is_admin() || is_network_admin()) {
        return;
    }
    if (!current_user_can('manage_woocommerce')) {
        return;
    }

    $last = get_option('mgw_chattanooga_last_sync', '');
    if (!$last) {
        $stale = true;
    } else {
        $last_ts = strtotime($last);
        $now_ts  = current_time('timestamp');
        // 6 hours = 21600 seconds.
        $stale = ($last_ts === false) || (($now_ts - $last_ts) > 21600);
    }

    if (!$stale) {
        return;
    }

    echo '<div class="notice notice-error"><p><strong>'
        . esc_html__('Warning:', 'modulargunworks')
        . '</strong> '
        . esc_html__('Chattanooga Data Sync has not run in over 6 hours. Inventory levels may be inaccurate.', 'modulargunworks')
        . '</p></div>';
}
add_action('admin_notices', 'modulargunworks_chattanooga_sync_stale_notice');

/**
 * Register shop sidebar for filters
 */
function modulargunworks_widgets_init() {
    register_sidebar([
        'name'          => __('Shop Sidebar', 'modulargunworks'),
        'id'            => 'shop-sidebar',
        'description'   => __('Filters and widgets for shop/category pages.', 'modulargunworks'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget_title">',
        'after_title'   => '</h3>',
    ]);
}
add_action('widgets_init', 'modulargunworks_widgets_init');

/**
 * WooCommerce cart count in header (AJAX update)
 */
function modulargunworks_cart_count_fragment($fragments) {
    if (!function_exists('WC') || !WC()->cart) {
        return $fragments;
    }
    $count = WC()->cart->get_cart_contents_count();
    $fragments['.cart-count-badge'] = '<span class="cart-count-badge" style="background:var(--color-primary);color:#fff;padding:2px 6px;border-radius:10px;font-size:0.75rem;">' . esc_html($count) . '</span>';
    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', 'modulargunworks_cart_count_fragment');

/**
 * Add Sort by Price Per Round (industry standard for ammo)
 */
add_filter('woocommerce_default_catalog_orderby_options', 'modulargunworks_add_cpr_sort_options');
add_filter('woocommerce_catalog_orderby', 'modulargunworks_add_cpr_sort_options');
function modulargunworks_add_cpr_sort_options($options) {
    if (!is_array($options)) return $options;
    $options['price_per_round'] = __('Sort by price per round: low to high', 'modulargunworks');
    $options['price_per_round_desc'] = __('Sort by price per round: high to low', 'modulargunworks');
    return $options;
}

add_filter('woocommerce_get_catalog_ordering_args', 'modulargunworks_catalog_ordering_args_cpr', 10, 3);
function modulargunworks_catalog_ordering_args_cpr($args, $orderby, $order) {
    if ($orderby === 'price_per_round') {
        $args['orderby'] = 'meta_value_num';
        $args['meta_key'] = '_price_per_round';
        $args['order'] = 'ASC';
        $args['meta_query'] = isset($args['meta_query']) ? $args['meta_query'] : [];
        $args['meta_query'][] = ['key' => '_price_per_round', 'compare' => 'EXISTS'];
        $args['meta_query'][] = ['key' => '_price_per_round', 'value' => 0, 'compare' => '>'];
    } elseif ($orderby === 'price_per_round_desc') {
        $args['orderby'] = 'meta_value_num';
        $args['meta_key'] = '_price_per_round';
        $args['order'] = 'DESC';
        $args['meta_query'] = isset($args['meta_query']) ? $args['meta_query'] : [];
        $args['meta_query'][] = ['key' => '_price_per_round', 'compare' => 'EXISTS'];
        $args['meta_query'][] = ['key' => '_price_per_round', 'value' => 0, 'compare' => '>'];
    }
    return $args;
}

/**
 * Results per page (24, 48, 96) - industry standard
 */
add_filter('loop_shop_per_page', 'modulargunworks_loop_shop_per_page', 20);
function modulargunworks_loop_shop_per_page($per_page) {
    if (!is_shop() && !is_product_category() && !is_tax('pa_brand')) return $per_page;
    $req = isset($_GET['per_page']) ? absint($_GET['per_page']) : 0;
    if (in_array($req, [24, 48, 96])) return $req;
    return $per_page;
}

/**
 * Disable subcategory boxes in product grid - we use Category in the filter sidebar instead.
 * Prevents blank column from WooCommerce injecting product-category li's into the grid.
 */
add_filter('woocommerce_get_loop_display_mode', function () {
    return 'products';
}, 999);

/**
 * Strip any product-category items from loop HTML (backup - removes blank grid cells)
 */
add_filter('woocommerce_product_loop_start', function ($html) {
    return preg_replace('/<li[^>]*product-category[^>]*>[\s\S]*?<\/li>\s*/i', '', $html);
}, 100);

/**
 * Remove product-category elements via JS (fallback for any that slip through)
 */
add_action('wp_footer', 'modulargunworks_remove_product_categories_js', 99);
function modulargunworks_remove_product_categories_js() {
    if (!function_exists('wc_get_page_id')) return;
    if (!is_shop() && !is_product_category() && !is_tax('pa_brand')) return;
    ?>
    <script>
    (function(){
      var list = document.querySelector('.mgw-shop-content .woocommerce ul.products, .woocommerce ul.products');
      if (list) {
        [].slice.call(list.querySelectorAll('li.product-category')).forEach(function(el){ el.remove(); });
      }
    })();
    </script>
    <?php
}

/**
 * Check if product requires FFL transfer (firearms, frames, receivers)
 */
function modulargunworks_product_is_ffl_required($product = null) {
    if (!$product) {
        global $product;
    }
    if (!$product || !is_a($product, 'WC_Product')) {
        return false;
    }
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if (!$terms || is_wp_error($terms)) {
        return false;
    }
    $ffl_slugs = ['firearms', 'guns'];
    foreach ($terms as $term) {
        if (in_array(strtolower($term->slug), $ffl_slugs)) {
            return true;
        }
    }
    return false;
}

/**
 * FFL notice on single product page (firearms) - industry standard
 */
function modulargunworks_single_product_ffl_notice() {
    global $product;
    if (!modulargunworks_product_is_ffl_required($product)) {
        return;
    }
    $ffl_url = get_permalink(get_page_by_path('firearm-transfer-guide')) ?: home_url('/firearm-transfer-guide/');
    ?>
    <div class="mgw-ffl-notice mgw-ffl-notice-product">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
            <strong><?php esc_html_e('FFL Required', 'modulargunworks'); ?></strong>
            <?php printf(
                wp_kses(__('This item is a firearm. Federal law requires shipment to a licensed FFL dealer. We cannot ship firearms to residential addresses or P.O. boxes. You must have your firearm shipped to an FFL of your choice and complete the transfer there. <a href="%s" target="_blank" rel="noopener">Learn more</a>', 'modulargunworks'),
                ['a' => ['href' => [], 'target' => [], 'rel' => []]]
            ), esc_url($ffl_url)); ?>
        </div>
    </div>
    <?php
}
add_action('woocommerce_before_add_to_cart_form', 'modulargunworks_single_product_ffl_notice', 5);

/**
 * Checkout notice when order contains firearms
 */
function modulargunworks_checkout_ffl_notice() {
    if (!function_exists('WC') || !WC()->cart) {
        return;
    }
    $has_firearms = false;
    foreach (WC()->cart->get_cart() as $item) {
        if (modulargunworks_product_is_ffl_required($item['data'])) {
            $has_firearms = true;
            break;
        }
    }
    if (!$has_firearms) {
        return;
    }
    ?>
    <div class="mgw-checkout-ffl-notice">
        <i class="fas fa-info-circle"></i>
        <p><?php esc_html_e('Your order contains firearms. The shipping address you provide must be a licensed FFL dealer. We will verify the FFL license before shipping. Firearms cannot be shipped to residential addresses or P.O. boxes.', 'modulargunworks'); ?></p>
    </div>
    <?php
}
add_action('woocommerce_before_checkout_form', 'modulargunworks_checkout_ffl_notice', 5);

/**
 * General state compliance notice on checkout (industry standard)
 */
function modulargunworks_checkout_state_notice() {
    $state_url = get_permalink(get_page_by_path('state-restrictions')) ?: home_url('/state-restrictions/');
    ?>
    <div class="mgw-checkout-state-notice">
        <p><?php printf(
            wp_kses(__('You are responsible for complying with your state\'s laws regarding ammunition and firearms. We reserve the right to refuse or cancel orders to restricted jurisdictions. <a href="%s" target="_blank" rel="noopener">State Restrictions</a>', 'modulargunworks'),
            ['a' => ['href' => [], 'target' => [], 'rel' => []]]
        ), esc_url($state_url)); ?></p>
    </div>
    <?php
}
add_action('woocommerce_before_checkout_form', 'modulargunworks_checkout_state_notice', 6);

/**
 * Add-to-cart notice for firearms - industry standard customer notice
 */
function modulargunworks_add_to_cart_ffl_notice($cart_item_key, $product_id) {
    $product = wc_get_product($product_id);
    if ($product && modulargunworks_product_is_ffl_required($product)) {
        wc_add_notice(__('This firearm must be shipped to a licensed FFL dealer. You cannot receive it at your home. See our Firearm Transfer Guide for details.', 'modulargunworks'), 'notice');
    }
}
add_action('woocommerce_add_to_cart', 'modulargunworks_add_to_cart_ffl_notice', 10, 2);

/**
 * Create default product categories on theme activation
 */
function modulargunworks_create_product_categories() {
    if (!taxonomy_exists('product_cat')) {
        return;
    }
    $categories = [
        'ammunition' => 'Ammunition',
        'magazines'   => 'Magazines',
        'firearms'   => 'Firearms',
        'gun-parts'  => 'Gun Parts',
        'gear'       => 'Gear',
        'optics'     => 'Optics',
        'reloading'  => 'Reloading',
        'outdoors'   => 'Outdoors',
        'brands'     => 'Brands',
    ];
    foreach ($categories as $slug => $name) {
        if (!term_exists($slug, 'product_cat')) {
            wp_insert_term($name, 'product_cat', ['slug' => $slug]);
        }
    }
    modulargunworks_create_ammo_subcategories();
}
add_action('after_switch_theme', 'modulargunworks_create_product_categories');

/**
 * Create Handgun, Rifle, Rimfire, Shotgun subcategories under Ammunition (industry standard: PSA, Ammo Depot).
 */
function modulargunworks_create_ammo_subcategories() {
    if (!taxonomy_exists('product_cat')) {
        return;
    }
    $ammo = get_term_by('slug', 'ammunition', 'product_cat');
    if (!$ammo || is_wp_error($ammo)) {
        return;
    }
    $parent_id = (int) $ammo->term_id;
    $subcats = [
        'handgun' => 'Handgun',
        'rifle'   => 'Rifle',
        'rimfire' => 'Rimfire',
        'shotgun' => 'Shotgun',
    ];
    foreach ($subcats as $slug => $name) {
        if (!term_exists($slug, 'product_cat')) {
            wp_insert_term($name, 'product_cat', ['slug' => $slug, 'parent' => $parent_id]);
        }
    }
}
add_action('init', 'modulargunworks_create_ammo_subcategories', 20);

/**
 * Contact form handler (admin-post)
 */
function modulargunworks_contact_form_handler() {
    if (!isset($_POST['action']) || $_POST['action'] !== 'modulargunworks_contact') {
        return;
    }
    check_admin_referer('modulargunworks_contact', 'contact_nonce');
    $name = isset($_POST['contact_name']) ? sanitize_text_field($_POST['contact_name']) : '';
    $email = isset($_POST['contact_email']) ? sanitize_email($_POST['contact_email']) : '';
    $message = isset($_POST['contact_message']) ? sanitize_textarea_field($_POST['contact_message']) : '';
    if ($name && $email && $message) {
        $to = get_option('admin_email');
        $subject = sprintf('[Modular Gunworks Contact] From %s', $name);
        $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
        wp_mail($to, $subject, $body);
    }
    wp_safe_redirect(add_query_arg('contact_sent', '1', wp_get_referer() ?: home_url('/contact/')));
    exit;
}
add_action('admin_post_nopriv_modulargunworks_contact', 'modulargunworks_contact_form_handler');
add_action('admin_post_modulargunworks_contact', 'modulargunworks_contact_form_handler');

/**
 * Single product: Back link to previous page, category, or shop
 */
function modulargunworks_single_product_back_link() {
    $back_url = '';
    $referer  = wp_get_referer();

    if ( $referer ) {
        $current = get_permalink();
        if ( $referer !== $current && wp_validate_redirect( $referer, false ) ) {
            $back_url = $referer;
        }
    }

    if ( ! $back_url && function_exists( 'wc_get_product' ) ) {
        global $product;
        if ( $product ) {
            $terms = get_the_terms( $product->get_id(), 'product_cat' );
            if ( $terms && ! is_wp_error( $terms ) ) {
                $term = $terms[0];
                $back_url = get_term_link( $term );
                if ( is_wp_error( $back_url ) ) {
                    $back_url = '';
                }
            }
        }
    }

    if ( ! $back_url && function_exists( 'wc_get_page_id' ) ) {
        $shop_id = wc_get_page_id( 'shop' );
        $back_url = $shop_id > 0 ? get_permalink( $shop_id ) : get_post_type_archive_link( 'product' );
    }

    if ( $back_url ) {
        echo '<nav class="mgw-product-back" aria-label="' . esc_attr__( 'Back', 'modulargunworks' ) . '">';
        echo '<a href="' . esc_url( $back_url ) . '" class="mgw-back-link">← ' . esc_html__( 'Back', 'modulargunworks' ) . '</a>';
        echo '</nav>';
    }
}
add_action( 'woocommerce_before_single_product', 'modulargunworks_single_product_back_link', 2 );

/**
 * Single product: professional storefront layout (Ammo Depot / PSA style)
 * Shows: title, price, SKU, brand, stock, add to cart, excerpt, description tabs.
 * Removed: rating, sharing, upsells, related products.
 */
function modulargunworks_single_product_minimal() {
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_sharing', 50);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40);
    remove_action('woocommerce_after_single_product_summary', 'woocommerce_upsell_display', 15);
    remove_action('woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20);
    add_action('woocommerce_single_product_summary', 'modulargunworks_product_info_block', 25);
}
add_action('woocommerce_before_single_product', 'modulargunworks_single_product_minimal', 5);

/**
 * Product info block: SKU, Brand, Stock - displayed prominently on single product
 */
function modulargunworks_product_info_block() {
    global $product;
    if (!$product || !is_a($product, 'WC_Product')) return;
    $sku = $product->get_sku();
    $brand = '';
    $terms = get_the_terms($product->get_id(), 'pa_brand');
    if ($terms && !is_wp_error($terms)) {
        $brand = $terms[0]->name;
    }
    $stock_status = $product->get_stock_status();
    $stock_text = $stock_status === 'instock' ? __('In Stock', 'modulargunworks') : __('Out of Stock', 'modulargunworks');
    if ($product->managing_stock() && $product->get_stock_quantity() !== null) {
        $qty = (int) $product->get_stock_quantity();
        $stock_text = $qty > 0 ? sprintf(__('%d in stock', 'modulargunworks'), $qty) : $stock_text;
    }
    if (!$sku && !$brand && !$stock_text) return;
    echo '<div class="mgw-product-info-block">';
    if ($sku) echo '<div class="mgw-product-sku"><span class="mgw-label">' . esc_html__('SKU', 'modulargunworks') . ':</span> ' . esc_html($sku) . '</div>';
    if ($brand) echo '<div class="mgw-product-brand"><span class="mgw-label">' . esc_html__('Brand', 'modulargunworks') . ':</span> ' . esc_html($brand) . '</div>';
    echo '<div class="mgw-product-stock mgw-stock-' . esc_attr($stock_status) . '"><span class="mgw-label">' . esc_html__('Availability', 'modulargunworks') . ':</span> ' . esc_html($stock_text) . '</div>';
    echo '</div>';
}

// Single product images are handled in `woocommerce/content-single-product.php`.

/**
 * Hide WooCommerce default stock display - we show it in product info block (no duplicate)
 */
function modulargunworks_hide_duplicate_stock( $html, $product ) {
    return '';
}
add_filter( 'woocommerce_get_stock_html', 'modulargunworks_hide_duplicate_stock', 10, 2 );

/**
 * Remove "Pay with GunTab" button from single product pages (keep Add to cart only)
 */
function modulargunworks_remove_guntab_quick_checkout_button() {
    if (class_exists('GunTab\GunTabPaymentGateway')) {
        remove_action('woocommerce_after_add_to_cart_button', [\GunTab\GunTabPaymentGateway::class, 'add_quick_checkout'], 10);
    }
}
add_action('init', 'modulargunworks_remove_guntab_quick_checkout_button', 20);

/**
 * Full catalog offline (temporary): hides every product and blocks shop / PDP / cart / checkout / my-account.
 *
 * Turn ON:  wp option update mgw_catalog_offline 1
 * Turn OFF: wp option delete mgw_catalog_offline
 * Or define MGW_CATALOG_OFFLINE as true/false in wp-config.php (overrides option when true).
 */
function modulargunworks_catalog_is_offline() {
	if ( is_admin() ) {
		return false;
	}
	if ( defined( 'MGW_CATALOG_OFFLINE' ) && MGW_CATALOG_OFFLINE ) {
		return true;
	}
	return (string) get_option( 'mgw_catalog_offline', '' ) === '1';
}

add_filter( 'woocommerce_product_is_visible', 'modulargunworks_catalog_offline_hide_products', 999, 2 );
function modulargunworks_catalog_offline_hide_products( $visible, $product_id ) {
	if ( ! modulargunworks_catalog_is_offline() ) {
		return $visible;
	}
	return false;
}

add_action( 'template_redirect', 'modulargunworks_catalog_offline_redirect', 0 );
function modulargunworks_catalog_offline_redirect() {
	if ( ! modulargunworks_catalog_is_offline() ) {
		return;
	}
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( ! function_exists( 'is_woocommerce' ) || ! is_woocommerce() ) {
		return;
	}
	// Allow customers to finish or pay for an existing order (email links).
	if ( is_checkout() && ( is_wc_endpoint_url( 'order-received' ) || is_wc_endpoint_url( 'order-pay' ) ) ) {
		return;
	}
	if ( is_shop() || is_product_taxonomy() || is_product() || is_cart() || is_checkout() || is_account_page() ) {
		wp_safe_redirect( home_url( '/' ), 302 );
		exit;
	}
}

add_action( 'pre_get_posts', 'modulargunworks_catalog_offline_exclude_search', 99 );
function modulargunworks_catalog_offline_exclude_search( $query ) {
	if ( ! modulargunworks_catalog_is_offline() || is_admin() || ! $query->is_main_query() || ! $query->is_search() ) {
		return;
	}
	$query->set( 'post_type', array( 'post', 'page' ) );
}

/**
 * AJAX shop filter refresh: return products grid + sidebar HTML (no full page reload).
 */
function modulargunworks_ajax_filter_content() {
	if ( ! function_exists( 'WC' ) || ! isset( $_REQUEST['mgw_filter'] ) || $_REQUEST['mgw_filter'] !== '1' ) {
		wp_send_json_error( [ 'message' => 'Invalid request' ] );
	}

	$clean = static function ( $key ) {
		return isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) : '';
	};

	foreach ( [ 'filter_stock', 'min_price', 'max_price', 'filter_pa_brand', 'filter_pa_caliber', 'filter_pa_bullet_type', 'filter_pa_grain_weight', 'filter_pa_capacity', 'orderby', 's', 'paged', 'product_cat', 'product_brand', 'per_page' ] as $p ) {
		if ( isset( $_GET[ $p ] ) ) {
			$_GET[ $p ] = is_array( $_GET[ $p ] ) ? array_map( 'sanitize_text_field', wp_unslash( $_GET[ $p ] ) ) : sanitize_text_field( wp_unslash( $_GET[ $p ] ) );
		}
	}

	$product_cat = $clean( 'product_cat' );
	$product_brand = $clean( 'product_brand' );
	if ( ! $product_cat && ! empty( $_GET['base_url'] ) ) {
		$path = wp_parse_url( esc_url_raw( wp_unslash( $_GET['base_url'] ) ), PHP_URL_PATH );
		if ( is_string( $path ) && preg_match( '#/(?:product-category|shop)/([^/]+)/?#', $path, $m ) ) {
			$product_cat = $m[1];
		}
	}
	if ( ! $product_brand && ! empty( $_GET['base_url'] ) ) {
		$path = wp_parse_url( esc_url_raw( wp_unslash( $_GET['base_url'] ) ), PHP_URL_PATH );
		if ( is_string( $path ) && preg_match( '#/brand/([^/]+)/?#', $path, $m ) ) {
			$product_brand = $m[1];
		}
	}

	$per_page = isset( $_GET['per_page'] ) ? absint( $_GET['per_page'] ) : 0;
	if ( ! in_array( $per_page, [ 24, 48, 96 ], true ) ) {
		$per_page = 24;
	}

	$args = [
		'post_type'      => 'product',
		'post_status'    => 'publish',
		'posts_per_page' => $per_page,
		'paged'          => max( 1, (int) ( $_GET['paged'] ?? 1 ) ),
	];

	$tax_query = [ 'relation' => 'AND' ];
	if ( $product_cat ) {
		$t = get_term_by( 'slug', $product_cat, 'product_cat' );
		if ( $t && ! is_wp_error( $t ) ) {
			$tax_query[] = [
				'taxonomy' => 'product_cat',
				'field'    => 'term_id',
				'terms'    => [ (int) $t->term_id ],
			];
		}
	}
	if ( $product_brand && taxonomy_exists( 'pa_brand' ) ) {
		$tax_query[] = [
			'taxonomy' => 'pa_brand',
			'field'    => 'slug',
			'terms'    => [ $product_brand ],
		];
	}

	$attr_map = [
		'filter_pa_brand'       => 'pa_brand',
		'filter_pa_caliber'     => 'pa_caliber',
		'filter_pa_bullet_type' => 'pa_bullet_type',
		'filter_pa_grain_weight'=> 'pa_grain_weight',
		'filter_pa_capacity'    => 'pa_capacity',
	];
	foreach ( $attr_map as $param => $tax ) {
		if ( empty( $_GET[ $param ] ) || ! taxonomy_exists( $tax ) ) {
			continue;
		}
		$v = array_filter( array_map( 'trim', explode( ',', sanitize_text_field( wp_unslash( $_GET[ $param ] ) ) ) ) );
		if ( ! empty( $v ) ) {
			$tax_query[] = [
				'taxonomy' => $tax,
				'field'    => 'slug',
				'terms'    => $v,
				'operator' => 'IN',
			];
		}
	}

	if ( count( $tax_query ) === 1 ) {
		unset( $tax_query['relation'] );
	}
	if ( empty( $tax_query ) ) {
		unset( $args['tax_query'] );
	} else {
		$args['tax_query'] = $tax_query;
	}

	$meta_query = [];
	if ( ! empty( $_GET['filter_stock'] ) && $_GET['filter_stock'] === 'instock' ) {
		$meta_query[] = [
			'key'     => '_stock_status',
			'value'   => 'instock',
			'compare' => '=',
		];
	}
	if ( ! empty( $meta_query ) ) {
		$args['meta_query'] = $meta_query;
	}

	if ( ! empty( $_GET['s'] ) ) {
		$args['s'] = sanitize_text_field( wp_unslash( $_GET['s'] ) );
	}

	$orderby = isset( $_GET['orderby'] ) ? sanitize_text_field( wp_unslash( $_GET['orderby'] ) ) : '';
	switch ( $orderby ) {
		case 'price':
			$args['meta_key'] = '_price';
			$args['orderby']  = 'meta_value_num';
			$args['order']    = 'ASC';
			break;
		case 'price-desc':
			$args['meta_key'] = '_price';
			$args['orderby']  = 'meta_value_num';
			$args['order']    = 'DESC';
			break;
		case 'popularity':
			$args['meta_key'] = 'total_sales';
			$args['orderby']  = 'meta_value_num';
			$args['order']    = 'DESC';
			break;
		case 'date':
			$args['orderby'] = 'date';
			$args['order']   = 'DESC';
			break;
	}

	if ( ! empty( $_GET['min_price'] ) || ! empty( $_GET['max_price'] ) ) {
		add_filter( 'posts_clauses', 'modulargunworks_ajax_price_clauses', 10, 2 );
	}

	global $wp_query;
	$wp_query = new WP_Query( $args );

	ob_start();
	include get_template_directory() . '/woocommerce/sidebar-shop-filters.php';
	$sidebar = ob_get_clean();

	ob_start();
	if ( $wp_query->have_posts() ) {
		echo '<div id="mgw-ajax-products-wrap">';
		woocommerce_output_all_notices();
		$search_action = $product_cat ? get_term_link( get_term_by( 'slug', $product_cat, 'product_cat' ) ) : ( $product_brand ? get_term_link( get_term_by( 'slug', $product_brand, 'pa_brand' ), 'pa_brand' ) : get_permalink( wc_get_page_id( 'shop' ) ) );
		if ( is_wp_error( $search_action ) ) {
			$search_action = home_url( '/shop' );
		}
		echo '<div class="product-controls mgw-product-controls"><form class="mgw-product-search-form" action="' . esc_url( $search_action ) . '" method="get">';
		if ( ! $product_cat && ! $product_brand ) {
			echo '<input type="hidden" name="post_type" value="product">';
		}
		foreach ( [ 'filter_stock', 'min_price', 'max_price', 'filter_pa_brand', 'filter_pa_caliber', 'filter_pa_bullet_type', 'filter_pa_grain_weight', 'filter_pa_capacity', 'orderby', 'per_page' ] as $k ) {
			if ( ! empty( $_GET[ $k ] ) ) {
				echo '<input type="hidden" name="' . esc_attr( $k ) . '" value="' . esc_attr( is_array( $_GET[ $k ] ) ? implode( ',', $_GET[ $k ] ) : $_GET[ $k ] ) . '">';
			}
		}
		echo '<input type="search" name="s" value="' . esc_attr( $clean( 's' ) ) . '" placeholder="' . esc_attr__( 'Search by name, brand, SKU', 'modulargunworks' ) . '" class="mgw-product-search-input"></form>';
		echo '<div class="product-count">';
		woocommerce_result_count();
		echo '</div><div class="mgw-ordering">';
		woocommerce_catalog_ordering();
		echo '</div></div>';
		woocommerce_product_loop_start();
		while ( $wp_query->have_posts() ) {
			$wp_query->the_post();
			wc_get_template_part( 'content', 'product' );
		}
		woocommerce_product_loop_end();
		woocommerce_pagination();
		echo '</div>';
	} else {
		echo '<div id="mgw-ajax-products-wrap">';
		do_action( 'woocommerce_no_products_found' );
		echo '</div>';
	}
	$products = ob_get_clean();

	remove_filter( 'posts_clauses', 'modulargunworks_ajax_price_clauses', 10 );
	wp_reset_postdata();

	wp_send_json_success( [ 'products' => $products, 'sidebar' => $sidebar ] );
}

function modulargunworks_ajax_price_clauses( $clauses, $q ) {
	global $wpdb;
	$min = isset( $_GET['min_price'] ) ? floatval( $_GET['min_price'] ) : 0;
	$max = isset( $_GET['max_price'] ) ? floatval( $_GET['max_price'] ) : 0;
	if ( $min <= 0 && $max <= 0 ) {
		return $clauses;
	}
	$clauses['join'] .= " INNER JOIN {$wpdb->postmeta} AS mgw_price ON {$wpdb->posts}.ID = mgw_price.post_id AND mgw_price.meta_key = '_price'";
	if ( $min > 0 ) {
		$clauses['where'] .= $wpdb->prepare( ' AND CAST(mgw_price.meta_value AS DECIMAL) >= %f', $min );
	}
	if ( $max > 0 ) {
		$clauses['where'] .= $wpdb->prepare( ' AND CAST(mgw_price.meta_value AS DECIMAL) <= %f', $max );
	}
	return $clauses;
}
add_action( 'wp_ajax_mgw_filter_content', 'modulargunworks_ajax_filter_content' );
add_action( 'wp_ajax_nopriv_mgw_filter_content', 'modulargunworks_ajax_filter_content' );

