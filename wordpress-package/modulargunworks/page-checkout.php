<?php
/**
 * Checkout Page Template
 * Ensures WooCommerce checkout always displays (GunTab payment flow)
 */
defined('ABSPATH') || exit;

if (!function_exists('WC') || !WC()->cart) {
    wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/'));
    exit;
}

get_header();
?>
<main class="mgw-checkout-page woocommerce woocommerce-checkout" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
  <?php
  woocommerce_output_all_notices();
  echo do_shortcode('[woocommerce_checkout]');
  ?>
</main>
<?php get_footer(); ?>
