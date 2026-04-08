<?php
/**
 * Plugin Name: MGW Chattanooga Product Sync
 * Description: Sync products from Chattanooga Shooting Supply API into WooCommerce.
 * Version: 1.0.0
 * Author: Modular Gunworks
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 */

defined('ABSPATH') || exit;

define('MGW_CHATTANOOGA_SYNC_VERSION', '1.0.0');
define('MGW_CHATTANOOGA_SYNC_PATH', plugin_dir_path(__FILE__));
define('MGW_CHATTANOOGA_SYNC_URL', plugin_dir_url(__FILE__));

require_once MGW_CHATTANOOGA_SYNC_PATH . 'includes/class-mgw-normalizer.php';
require_once MGW_CHATTANOOGA_SYNC_PATH . 'includes/class-mgw-sync.php';

/**
 * Init plugin
 */
function mgw_chattanooga_sync_init() {
    if (!class_exists('WooCommerce')) {
        return;
    }
    MGW_Chattanooga_Sync::instance();
}
add_action('plugins_loaded', 'mgw_chattanooga_sync_init');

/**
 * Activation: schedule cron
 */
function mgw_chattanooga_sync_activate() {
    if (wp_next_scheduled('mgw_chattanooga_sync_cron')) {
        return;
    }
    wp_schedule_event(time(), 'mgw_four_hours', 'mgw_chattanooga_sync_cron');
}
register_activation_hook(__FILE__, 'mgw_chattanooga_sync_activate');

/**
 * Deactivation: clear cron
 */
function mgw_chattanooga_sync_deactivate() {
    wp_clear_scheduled_hook('mgw_chattanooga_sync_cron');
}
register_deactivation_hook(__FILE__, 'mgw_chattanooga_sync_deactivate');

/**
 * Add cron interval
 */
function mgw_chattanooga_sync_cron_intervals($schedules) {
    $schedules['mgw_four_hours'] = [
        'interval' => 4 * HOUR_IN_SECONDS,
        'display'  => __('Every 4 Hours', 'mgw-chattanooga-sync'),
    ];
    return $schedules;
}
add_filter('cron_schedules', 'mgw_chattanooga_sync_cron_intervals');
