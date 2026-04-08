<?php
/**
 * Plugin Name: MGW Force Cart & Checkout Display
 * Description: Ensures cart and checkout pages always show content (works with any theme).
 * Version: 1.0
 */

if (!defined('ABSPATH')) exit;

add_filter('the_content', 'mgw_force_cart_checkout_content', 999);
add_filter('template_include', 'mgw_force_cart_template', 99999);

function mgw_force_cart_checkout_content($content) {
    if (!function_exists('wc_get_page_id') || !function_exists('WC')) return $content;
    $cart_id = wc_get_page_id('cart');
    $checkout_id = wc_get_page_id('checkout');
    if ($cart_id > 0 && is_page($cart_id)) {
        $has = (strpos($content, 'woocommerce-cart-form') !== false || strpos($content, 'cart-empty') !== false);
        if (!$has || trim(strip_tags($content)) === '' || trim($content) === '[woocommerce_cart]') {
            return do_shortcode('[woocommerce_cart]');
        }
    }
    if ($checkout_id > 0 && is_page($checkout_id)) {
        $has = (strpos($content, 'woocommerce-checkout') !== false || strpos($content, 'checkout_form') !== false);
        if (!$has || trim(strip_tags($content)) === '' || trim($content) === '[woocommerce_checkout]') {
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
        $our_template = dirname(__FILE__) . '/cart-checkout-template.php';
        if (file_exists($our_template)) {
            return $our_template;
        }
    }
    return $template;
}
