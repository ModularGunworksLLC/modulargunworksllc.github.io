<?php
/**
 * WooCommerce sidebar → theme shop-sidebar widget area (native WC widgets / Layered Nav / Price filter).
 *
 * @package WooCommerce\Templates
 */
defined( 'ABSPATH' ) || exit;

if ( is_active_sidebar( 'shop-sidebar' ) ) {
	echo '<aside id="secondary" class="widget-area mgw-woo-sidebar" role="complementary">';
	dynamic_sidebar( 'shop-sidebar' );
	echo '</aside>';
}
