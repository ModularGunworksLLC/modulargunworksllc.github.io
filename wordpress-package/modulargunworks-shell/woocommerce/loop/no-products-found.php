<?php
/**
 * Empty shop / category — greenfield shell.
 */
defined( 'ABSPATH' ) || exit;
?>
<div class="mgw-catalog-empty woocommerce-info">
	<p class="mgw-catalog-empty__title"><?php esc_html_e( 'No products in this category yet', 'modulargunworks-shell' ); ?></p>
	<p class="mgw-catalog-empty__text">
		<?php esc_html_e( 'Catalog sync will populate this area. Browse other departments or check back soon.', 'modulargunworks-shell' ); ?>
	</p>
	<p class="mgw-catalog-empty__actions">
		<a class="button" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'modulargunworks-shell' ); ?></a>
		<?php if ( function_exists( 'wc_get_page_permalink' ) ) : ?>
			<a class="button" href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"><?php esc_html_e( 'View shop', 'modulargunworks-shell' ); ?></a>
		<?php endif; ?>
	</p>
</div>
