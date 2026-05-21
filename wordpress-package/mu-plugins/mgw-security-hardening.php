<?php
/**
 * Plugin Name: MGW Security Hardening
 * Description: Disables public REST user enumeration and reduces author archive disclosure.
 * Version: 1.0.0
 *
 * @package MGW
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Block unauthenticated access to /wp-json/wp/v2/users (username enumeration).
 *
 * @param array $endpoints Registered REST routes.
 * @return array
 */
function mgw_security_filter_rest_user_endpoints( $endpoints ) {
	if ( is_user_logged_in() ) {
		return $endpoints;
	}

	unset( $endpoints['/wp/v2/users'] );
	unset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );

	return $endpoints;
}
add_filter( 'rest_endpoints', 'mgw_security_filter_rest_user_endpoints' );

/**
 * Redirect author archives to home (/?author=1 slug discovery).
 */
function mgw_security_block_author_archives() {
	if ( is_author() && ! is_user_logged_in() ) {
		wp_safe_redirect( home_url( '/' ), 301 );
		exit;
	}
}
add_action( 'template_redirect', 'mgw_security_block_author_archives' );
