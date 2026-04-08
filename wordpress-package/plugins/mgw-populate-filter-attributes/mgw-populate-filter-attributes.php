<?php
/**
 * Plugin Name: MGW Populate Filter Attributes
 * Description: Backfill pa_caliber, pa_bullet_type, pa_grain_weight, pa_brand, pa_capacity from product names for existing products.
 * Version: 1.0.0
 * Author: Modular Gunworks
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 */

defined('ABSPATH') || exit;

define('MGW_POPULATE_FILTER_ATTRS_VERSION', '1.0.0');
define('MGW_POPULATE_FILTER_ATTRS_PATH', plugin_dir_path(__FILE__));

require_once MGW_POPULATE_FILTER_ATTRS_PATH . 'includes/class-mgw-populate-attrs.php';

function mgw_populate_filter_attrs_init() {
    if (!class_exists('WooCommerce')) {
        return;
    }
    MGW_Populate_Attrs::instance();
}
add_action('plugins_loaded', 'mgw_populate_filter_attrs_init');

/**
 * WP-CLI command
 */
if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('mgw populate-filter-attrs', function ($args, $assoc_args) {
        $populate = MGW_Populate_Attrs::instance();
        $result = $populate->run_backfill();
        WP_CLI::success("Updated: {$result['updated']}, Skipped: {$result['skipped']}");
    });
}
