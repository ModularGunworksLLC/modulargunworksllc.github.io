<?php
/**
 * Product taxonomy archive header
 *
 * @package WooCommerce\Templates
 * @version 8.6.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<header class="woocommerce-products-header mgw-wc-products-header">
	<?php
	/**
	 * Hook: woocommerce_show_page_title.
	 */
	if ( apply_filters( 'woocommerce_show_page_title', true ) ) :
		?>
		<h1 class="woocommerce-products-header__title page-title mgw-wc-products-header__title"><?php woocommerce_page_title(); ?></h1>
	<?php endif; ?>

	<?php
	/**
	 * Hook: woocommerce_archive_description.
	 */
	do_action( 'woocommerce_archive_description' );
	?>
</header>
