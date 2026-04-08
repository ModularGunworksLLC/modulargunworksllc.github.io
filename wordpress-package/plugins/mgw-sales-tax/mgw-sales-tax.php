<?php
/**
 * Plugin Name: MGW Sales Tax Configuration
 * Description: Configures WooCommerce sales tax for Modular Gunworks (Huntsville, AL). Destination-based Alabama tax.
 * Version: 1.0
 */

if (!defined('ABSPATH')) exit;

add_action('woocommerce_init', 'mgw_sales_tax_maybe_setup', 5);

function mgw_sales_tax_maybe_setup() {
    if (!class_exists('WooCommerce') || !class_exists('WC_Tax')) return;
    if (get_option('mgw_sales_tax_configured', false)) return;

    // Enable taxes
    update_option('woocommerce_calc_taxes', 'yes');
    update_option('woocommerce_prices_include_tax', 'no');
    update_option('woocommerce_tax_based_on', 'shipping'); // Destination-based
    update_option('woocommerce_shipping_tax_class', '');
    update_option('woocommerce_tax_round_at_subtotal', 'no');
    update_option('woocommerce_tax_display_shop', 'excl');
    update_option('woocommerce_tax_display_cart', 'excl');
    update_option('woocommerce_tax_total_display', 'itemized');

    // Add Alabama tax rate (9% - Huntsville/Madison County combined rate)
    // Edit rate in WooCommerce → Settings → Tax → Standard rates
    global $wpdb;
    $table = $wpdb->prefix . 'woocommerce_tax_rates';
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT tax_rate_id FROM {$table} WHERE tax_rate_country = 'US' AND tax_rate_state = 'AL' LIMIT 1"
    ));
    if (!$exists && method_exists('WC_Tax', '_insert_tax_rate')) {
        $tax_data = [
            'tax_rate_country'  => 'US',
            'tax_rate_state'    => 'AL',
            'tax_rate'          => '9.000',
            'tax_rate_name'     => 'Alabama Sales Tax',
            'tax_rate_priority' => 1,
            'tax_rate_compound' => 0,
            'tax_rate_shipping' => 1,
            'tax_rate_order'    => 0,
            'tax_rate_class'    => '',
        ];
        WC_Tax::_insert_tax_rate($tax_data);
        if (class_exists('WC_Cache_Helper')) {
            WC_Cache_Helper::invalidate_cache_group('taxes');
        }
    }

    update_option('mgw_sales_tax_configured', true);
}

add_filter('plugin_action_links_mgw-sales-tax/mgw-sales-tax.php', 'mgw_sales_tax_plugin_links');
function mgw_sales_tax_plugin_links($links) {
    $links[] = '<a href="' . admin_url('admin.php?page=wc-settings&tab=tax') . '">Tax Settings</a>';
    return $links;
}

add_action('admin_notices', 'mgw_sales_tax_admin_notice');
function mgw_sales_tax_admin_notice() {
    if (!get_option('mgw_sales_tax_configured')) return;
    $screen = get_current_screen();
    if (!$screen || strpos($screen->id, 'woocommerce') === false) return;
    ?>
    <div class="notice notice-info">
        <p><strong>MGW Sales Tax:</strong> Alabama (9%) is configured. Review <a href="<?php echo esc_url(admin_url('admin.php?page=wc-settings&tab=tax')); ?>">WooCommerce → Settings → Tax</a> to add ZIP-specific or out-of-state rates. See <code>SALES-TAX-SETUP.md</code> for the full guide.</p>
    </div>
    <?php
}
