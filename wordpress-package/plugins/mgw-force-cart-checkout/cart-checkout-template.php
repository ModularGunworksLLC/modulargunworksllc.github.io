<?php
/**
 * Minimal template - forces cart/checkout to display
 */
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
