<?php
/**
 * Empty shop / category archive (canvas reset or before first sync).
 *
 * @package WooCommerce\Templates
 */

defined( 'ABSPATH' ) || exit;

?>
<div class="mgw-catalog-empty woocommerce-info">
	<p class="mgw-catalog-empty__title"><?php esc_html_e( 'No products in this category yet', 'modulargunworks' ); ?></p>
	<p class="mgw-catalog-empty__text">
		<?php esc_html_e( 'Our catalog is being refreshed. Check back soon, or browse other departments from the menu.', 'modulargunworks' ); ?>
	</p>
	<p class="mgw-catalog-empty__actions">
		<a class="button" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'modulargunworks' ); ?></a>
		<?php if ( function_exists( 'wc_get_page_permalink' ) ) : ?>
			<a class="button" href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"><?php esc_html_e( 'View shop', 'modulargunworks' ); ?></a>
		<?php endif; ?>
	</p>
</div>
