#!/bin/bash
# Run in SSH on Lightsail. Installs MGW Force Cart plugin so cart/checkout always display.

WP="/opt/bitnami/wordpress"
PLUGINS="$WP/wp-content/plugins"
PKG="/home/bitnami/modulargunworksllc.github.io/wordpress-package"

if [ -d "$PKG/plugins/mgw-force-cart-checkout" ]; then
  echo "Copying from local package..."
  sudo rm -rf "$PLUGINS/mgw-force-cart-checkout"  # remove partial install from earlier run
  sudo cp -r "$PKG/plugins/mgw-force-cart-checkout" "$PLUGINS/"
  sudo chown -R daemon:daemon "$PLUGINS/mgw-force-cart-checkout" 2>/dev/null || true
  echo "Done. Activate: Plugins -> MGW Force Cart & Checkout Display -> Activate"
else
  echo "Local package not found. Creating plugin inline..."
  sudo mkdir -p "$PLUGINS/mgw-force-cart-checkout"
  sudo tee "$PLUGINS/mgw-force-cart-checkout/mgw-force-cart-checkout.php" > /dev/null << 'ENDPHP'
<?php
/**
 * Plugin Name: MGW Force Cart & Checkout Display
 * Description: Ensures cart and checkout pages always show content (works with any theme).
 * Version: 1.0
 */
if (!defined('ABSPATH')) exit;
add_filter('the_content', 'mgw_force_cart_checkout_content', 999);
add_filter('template_include', 'mgw_force_cart_template', 99999);
add_filter('woocommerce_return_to_shop_redirect', 'mgw_return_to_shop_url');
function mgw_force_cart_checkout_content($content) {
    if (!function_exists('wc_get_page_id') || !function_exists('WC')) return $content;
    $cart_id = wc_get_page_id('cart');
    $checkout_id = wc_get_page_id('checkout');
    if ($cart_id > 0 && is_page($cart_id)) {
        $has = (strpos($content,'woocommerce-cart-form')!==false || strpos($content,'cart-empty')!==false);
        if (!$has || trim(strip_tags($content))=='' || trim($content)=='[woocommerce_cart]') {
            return do_shortcode('[woocommerce_cart]');
        }
    }
    if ($checkout_id > 0 && is_page($checkout_id)) {
        $has = (strpos($content,'woocommerce-checkout')!==false || strpos($content,'checkout_form')!==false);
        if (!$has || trim(strip_tags($content))=='' || trim($content)=='[woocommerce_checkout]') {
            return do_shortcode('[woocommerce_checkout]');
        }
    }
    return $content;
}
function mgw_force_cart_template($template) {
    if (!function_exists('wc_get_page_id')) return $template;
    $cart_id = wc_get_page_id('cart');
    $checkout_id = wc_get_page_id('checkout');
    $is_cart = ($cart_id > 0 && is_page($cart_id)) || (function_exists('is_cart') && is_cart());
    $is_checkout = ($checkout_id > 0 && is_page($checkout_id)) || (function_exists('is_checkout') && is_checkout() && !is_wc_endpoint_url());
    if ($is_cart || $is_checkout) {
        $our = dirname(__FILE__) . '/cart-checkout-template.php';
        if (file_exists($our)) return $our;
    }
    return $template;
}
function mgw_return_to_shop_url($url) {
    if (function_exists('wc_get_page_permalink')) return wc_get_page_permalink('shop');
    if (function_exists('wc_get_page_id')) {
        $shop_id = wc_get_page_id('shop');
        return $shop_id > 0 ? get_permalink($shop_id) : home_url('/shop');
    }
    return home_url('/shop');
}
ENDPHP
  sudo tee "$PLUGINS/mgw-force-cart-checkout/cart-checkout-template.php" > /dev/null << 'ENDTMPL'
<?php
defined('ABSPATH') || exit;
get_header();
?>
<main class="woocommerce" style="max-width:1200px;margin:2rem auto;padding:0 2rem;">
<?php
if (function_exists('is_cart') && is_cart() || (function_exists('wc_get_page_id') && is_page(wc_get_page_id('cart')))) {
    if (function_exists('woocommerce_output_all_notices')) woocommerce_output_all_notices();
    echo do_shortcode('[woocommerce_cart]');
} elseif (function_exists('is_checkout') && is_checkout() || (function_exists('wc_get_page_id') && is_page(wc_get_page_id('checkout')))) {
    if (function_exists('woocommerce_output_all_notices')) woocommerce_output_all_notices();
    echo do_shortcode('[woocommerce_checkout]');
}
?>
</main>
<?php get_footer(); ?>
ENDTMPL
  sudo chown -R daemon:daemon "$PLUGINS/mgw-force-cart-checkout" 2>/dev/null || true
  echo "Plugin created. Activate: Plugins -> MGW Force Cart & Checkout Display -> Activate"
fi
