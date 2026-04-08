<?php
/**
 * Admin runner for category-specific Filter Everything setup.
 * Provides one-click setup without WP-CLI.
 */
defined('ABSPATH') || exit;

function mgw_admin_category_filters_setup() {
    add_submenu_page(
        'tools.php',
        __('MGW Category Filters', 'modulargunworks'),
        __('MGW Category Filters', 'modulargunworks'),
        'manage_options',
        'mgw-category-filters',
        'mgw_render_category_filters_admin'
    );
}
add_action('admin_menu', 'mgw_admin_category_filters_setup', 99);

function mgw_render_category_filters_admin() {
    $run = isset($_POST['mgw_run_category_filters']) && current_user_can('manage_options');
    if ($run) {
        check_admin_referer('mgw_run_category_filters');
        $result = mgw_run_category_filters_setup();
    }
    $mapping = get_option('mgw_filter_set_ids', []);
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('MGW Category Filter Setup', 'modulargunworks'); ?></h1>
        <p><?php esc_html_e('Creates category-specific Filter Everything sets so Gear shows only In Stock + Price + Brand, Ammunition shows full filters (Caliber, Bullet Type, Grain, etc.), and each category gets relevant filters.', 'modulargunworks'); ?></p>
        <?php if ($run && isset($result)) : ?>
            <div class="notice notice-success"><p><?php echo esc_html($result['message']); ?></p></div>
        <?php endif; ?>
        <?php if (!empty($mapping)) : ?>
            <p><strong><?php esc_html_e('Current mapping:', 'modulargunworks'); ?></strong> <?php echo esc_html(implode(', ', array_keys($mapping))); ?></p>
        <?php endif; ?>
        <form method="post">
            <?php wp_nonce_field('mgw_run_category_filters'); ?>
            <p><button type="submit" name="mgw_run_category_filters" class="button button-primary"><?php esc_html_e('Run Setup Now', 'modulargunworks'); ?></button></p>
        </form>
        <p class="description"><?php esc_html_e('Requires Filter Everything plugin. After running, ensure the "Filter Everything - Filters" widget is in the Shop Sidebar (Appearance → Widgets).', 'modulargunworks'); ?></p>
    </div>
    <?php
}

function mgw_run_category_filters_setup() {
    if (!defined('FLRT_FILTERS_SET_POST_TYPE')) {
        return ['message' => __('Filter Everything plugin is not active.', 'modulargunworks')];
    }
    $path = dirname(get_template_directory()) . '/mgw-setup-category-filters.php';
    if (!file_exists($path)) {
        return ['message' => __('Setup file not found.', 'modulargunworks')];
    }
    ob_start();
    require $path;
    $out = ob_get_clean();
    return ['message' => $out ?: __('Setup complete.', 'modulargunworks')];
}
