<?php
/**
 * Cart Page Template
 * Ensures WooCommerce cart always displays (fixes empty cart page issue)
 */
defined('ABSPATH') || exit;

if (!function_exists('WC') || !WC()->cart) {
    wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/'));
    exit;
}

get_header();
?>
<main class="mgw-cart-page woocommerce woocommerce-cart" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
  <h1 class="page-title"><?php esc_html_e('Cart', 'modulargunworks'); ?></h1>
  <?php
  woocommerce_output_all_notices();
  echo do_shortcode('[woocommerce_cart]');
  ?>
</main>
<?php get_footer(); ?>
