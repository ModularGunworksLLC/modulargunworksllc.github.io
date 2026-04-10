<?php
/**
 * Checkout page template.
 *
 * Normalized to use page content so WooCommerce shortcodes/blocks remain plugin-managed.
 */
defined( 'ABSPATH' ) || exit;

get_header();
?>
<main class="mgw-checkout-page woocommerce woocommerce-checkout" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
	<?php
	while ( have_posts() ) :
		the_post();
		the_content();
	endwhile;
	?>
</main>
<?php get_footer(); ?>
