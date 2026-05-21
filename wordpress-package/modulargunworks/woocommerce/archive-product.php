<?php
/**
 * Product archives — full-width heading, then sidebar + toolbar/products (Modular Gunworks).
 *
 * @package WooCommerce\Templates
 * @version 8.6.0
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

if ( function_exists( 'modulargunworks_needs_shop_sidebar_layout' ) && modulargunworks_needs_shop_sidebar_layout() ) {

	echo '<div class="mgw-shop-wrapper">';

	echo '<div class="mgw-shop-archive-heading">';
	woocommerce_breadcrumb();
	/**
	 * Hook: woocommerce_shop_loop_header.
	 *
	 * @hooked woocommerce_product_taxonomy_archive_header - 10
	 */
	do_action( 'woocommerce_shop_loop_header' );
	echo '</div>';

	if ( function_exists( 'WC' ) && class_exists( 'WC_Structured_Data' ) && WC()->structured_data instanceof WC_Structured_Data ) {
		WC()->structured_data->generate_website_data();
	}

	echo '<main id="primary" class="content-area mgw-shop-main">';
	wc_get_template( 'global/sidebar.php' );
	echo '<div class="mgw-shop-content">';

} else {
	do_action( 'woocommerce_before_main_content' );
	/**
	 * Hook: woocommerce_shop_loop_header.
	 */
	do_action( 'woocommerce_shop_loop_header' );
}

if ( woocommerce_product_loop() ) {

	if ( function_exists( 'modulargunworks_needs_shop_sidebar_layout' ) && modulargunworks_needs_shop_sidebar_layout() ) {
		echo '<div class="mgw-shop-toolbar">';
	}

	/**
	 * Hook: woocommerce_before_shop_loop.
	 */
	do_action( 'woocommerce_before_shop_loop' );

	if ( function_exists( 'modulargunworks_needs_shop_sidebar_layout' ) && modulargunworks_needs_shop_sidebar_layout() ) {
		echo '</div>';
	}

	woocommerce_product_loop_start();

	if ( wc_get_loop_prop( 'total' ) ) {
		while ( have_posts() ) {
			the_post();

			/**
			 * Hook: woocommerce_shop_loop.
			 */
			do_action( 'woocommerce_shop_loop' );

			wc_get_template_part( 'content', 'product' );
		}
	}

	woocommerce_product_loop_end();

	/**
	 * Hook: woocommerce_after_shop_loop.
	 */
	do_action( 'woocommerce_after_shop_loop' );
} else {
	/**
	 * Hook: woocommerce_no_products_found.
	 */
	do_action( 'woocommerce_no_products_found' );
}

if ( function_exists( 'modulargunworks_needs_shop_sidebar_layout' ) && modulargunworks_needs_shop_sidebar_layout() ) {
	echo '</div></main></div>';
} else {
	/**
	 * Hook: woocommerce_after_main_content.
	 */
	do_action( 'woocommerce_after_main_content' );
}

/**
 * Default WooCommerce sidebar (widgets). Skip when filters already render in {@see wc_get_template( 'global/sidebar.php' )} inside mgw-shop-main — otherwise the same widgets output twice and cover the footer.
 */
if ( ! function_exists( 'modulargunworks_needs_shop_sidebar_layout' ) || ! modulargunworks_needs_shop_sidebar_layout() ) {
	do_action( 'woocommerce_sidebar' );
}

get_footer( 'shop' );
