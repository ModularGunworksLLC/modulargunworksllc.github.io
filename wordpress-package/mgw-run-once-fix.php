<?php
/**
 * RUN ONCE: Fix Cart & Checkout pages + Activate Crypto Polyfill
 *
 * 1. Upload this file to your WordPress ROOT (same folder as wp-config.php)
 * 2. Visit: https://yoursite.com/mgw-run-once-fix.php?key=mgw2024fix
 * 3. Delete this file after it runs successfully
 */
define('MGW_FIX_KEY', 'mgw2024fix');
if (!isset($_GET['key']) || $_GET['key'] !== MGW_FIX_KEY) {
    status_header(404);
    exit('Not found');
}

require_once __DIR__ . '/wp-load.php';

if (!current_user_can('manage_options')) {
    wp_die('You must be logged in as admin. Log in, then visit this URL again.');
}

$done = [];

// Fix Cart page
if (function_exists('wc_get_page_id')) {
    $cart_id = wc_get_page_id('cart');
    $checkout_id = wc_get_page_id('checkout');

    if ($cart_id > 0) {
        $cart = get_post($cart_id);
        if ($cart && $cart->post_status === 'publish') {
            wp_update_post([
                'ID' => $cart_id,
                'post_content' => '[woocommerce_cart]',
                'post_status' => 'publish',
            ]);
            $done[] = 'Cart page updated with [woocommerce_cart]';
        }
    }

    if ($checkout_id > 0) {
        $checkout = get_post($checkout_id);
        if ($checkout && $checkout->post_status === 'publish') {
            wp_update_post([
                'ID' => $checkout_id,
                'post_content' => '[woocommerce_checkout]',
                'post_status' => 'publish',
            ]);
            $done[] = 'Checkout page updated with [woocommerce_checkout]';
        }
    }
}

// Activate crypto polyfill plugin if exists
$plugin = 'mgw-crypto-polyfill/mgw-crypto-polyfill.php';
if (file_exists(WP_PLUGIN_DIR . '/' . $plugin)) {
    if (!is_plugin_active($plugin)) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        activate_plugin($plugin, '', false, true);
        $done[] = 'MGW Crypto Polyfill plugin activated';
    } else {
        $done[] = 'MGW Crypto Polyfill plugin was already active';
    }
} else {
    $done[] = 'MGW Crypto Polyfill plugin not found – upload the mgw-crypto-polyfill folder to wp-content/plugins/ first, then run this again';
}

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MGW Fix Complete</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 60px auto; padding: 20px; }
        h1 { color: #46b450; }
        ul { line-height: 1.8; }
        .warning { background: #fff3cd; padding: 12px; border-radius: 4px; margin-top: 20px; }
        a { color: #0073aa; }
    </style>
</head>
<body>
    <h1>Fix complete</h1>
    <ul>
        <?php foreach ($done as $item) : ?>
            <li><?php echo esc_html($item); ?></li>
        <?php endforeach; ?>
    </ul>
    <div class="warning">
        <strong>Important:</strong> Delete this file now for security.<br>
        Remove: <code>mgw-run-once-fix.php</code> from your WordPress root folder.
    </div>
    <p style="margin-top: 24px;">
        <a href="<?php echo esc_url(admin_url()); ?>">Go to WordPress Admin</a> ·
        <a href="<?php echo esc_url(wc_get_page_permalink('cart')); ?>">View Cart</a>
    </p>
</body>
</html>
