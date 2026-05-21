<?php
/**
 * Plugin Name: MGW Request Guard
 * Description: Redirects abusive combinatoric facet URLs to canonical category paths so PHP-FPM is not exhausted by crawlers.
 * Author: Modular Gunworks
 * Version: 1.0.0
 *
 * @package MGW
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Maximum raw QUERY_STRING length before redirect (non-privileged users). */
const MGW_RG_MAX_QUERY_LEN = 480;

/** Maximum semicolon-separated values counted in ?brand=... */
const MGW_RG_MAX_BRAND_SEGMENTS = 4;

/** Maximum non-tracking query parameters (utm_* / gclid / fbclid excluded). */
const MGW_RG_MAX_FILTER_KEYS = 4;

/** Maximum semicolons anywhere in QUERY_STRING (facet explosion heuristic). */
const MGW_RG_MAX_SEMICOLONS = 4;

/**
 * URI path prefixes that receive facet protection (leading slash, lowercase match).
 *
 * @var string[]
 */
const MGW_RG_PREFIXES = array(
	'/product-category/',
	'/shop/',
);

/**
 * @return string Request path starting with /, lowercased.
 */
function mwg_rg_request_path() {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
	$path = wp_parse_url( $uri, PHP_URL_PATH );
	return is_string( $path ) ? strtolower( $path ) : '';
}

/**
 * @return bool
 */
function mwg_rg_is_protected_path() {
	$path = mwg_rg_request_path();
	foreach ( MGW_RG_PREFIXES as $prefix ) {
		if ( strpos( $path, $prefix ) === 0 ) {
			return true;
		}
	}
	return false;
}

/**
 * Shop staff and admins may use deeper facets when testing.
 *
 * @return bool
 */
function mwg_rg_is_privileged() {
	if ( ! function_exists( 'is_user_logged_in' ) || ! is_user_logged_in() ) {
		return false;
	}
	return current_user_can( 'edit_products' ) || current_user_can( 'manage_options' );
}

/**
 * @return int Number of non-empty brand tokens in ?brand=a;b;c
 */
function mwg_rg_brand_segment_count() {
	if ( empty( $_GET['brand'] ) || ! is_string( $_GET['brand'] ) ) {
		return 0;
	}
	$parts = explode( ';', wp_unslash( $_GET['brand'] ) );
	$n     = 0;
	foreach ( $parts as $p ) {
		if ( trim( $p ) !== '' ) {
			++$n;
		}
	}
	return $n;
}

/**
 * WooCommerce catalog / layered-nav params must not count toward the facet-abuse limit.
 * Otherwise ?filter_brand=&filter_caliber=&orderby=&per_page= triggers a 301 that strips
 * all query args and the grid never reflects filters (looks like "filters do nothing").
 *
 * @param string $key Lowercased query parameter name.
 * @return bool True if this key should be ignored for abuse counting.
 */
function mwg_rg_is_catalog_navigation_param( $key ) {
	static $exact = null;
	if ( null === $exact ) {
		$exact = array(
			'post_type'            => true,
			'paged'                => true,
			'orderby'              => true,
			'order'                => true,
			'per_page'             => true,
			'min_price'            => true,
			'max_price'            => true,
			's'                    => true,
			'srch'                 => true, // Filter Everything search widget.
			'filter_stock_status'  => true,
			'filter_stock'         => true,
			'on_sale'              => true,
			'filter_product_cat'   => true,
			'query_type'           => true, // Woo layered nav (and/or).
			'rating_filter'        => true,
			'stock_status'         => true,
		);
	}
	if ( isset( $exact[ $key ] ) ) {
		return true;
	}
	// Native WC layered nav: filter_brand, filter_caliber, filter_pa_*, etc.
	if ( 0 === strpos( $key, 'filter_' ) ) {
		return true;
	}
	return false;
}

/**
 * @return int
 */
function mwg_rg_meaningful_query_key_count() {
	static $skip = null;
	if ( null === $skip ) {
		$skip = array(
			'utm_source'   => true,
			'utm_medium'   => true,
			'utm_campaign' => true,
			'utm_content'  => true,
			'utm_term'     => true,
			'gclid'        => true,
			'fbclid'       => true,
			'msclkid'      => true,
		);
	}
	$n = 0;
	foreach ( array_keys( $_GET ) as $key ) {
		$lk = strtolower( (string) $key );
		if ( isset( $skip[ $lk ] ) ) {
			continue;
		}
		if ( mwg_rg_is_catalog_navigation_param( $lk ) ) {
			continue;
		}
		++$n;
	}
	return $n;
}

/**
 * @return bool True if this request should 301 to path-only URL.
 */
function mwg_rg_should_strip_query() {
	if ( ! isset( $_SERVER['REQUEST_METHOD'] ) ) {
		return false;
	}
	$m = $_SERVER['REQUEST_METHOD'];
	if ( 'GET' !== $m && 'HEAD' !== $m ) {
		return false;
	}

	if ( is_admin() ) {
		return false;
	}

	if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
		return false;
	}

	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		return false;
	}

	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		return false;
	}

	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return false;
	}

	if ( ! mwg_rg_is_protected_path() ) {
		return false;
	}

	$qs = isset( $_SERVER['QUERY_STRING'] ) ? $_SERVER['QUERY_STRING'] : '';
	if ( '' === $qs ) {
		return false;
	}

	$brand_raw = isset( $_GET['brand'] ) && is_string( $_GET['brand'] ) ? wp_unslash( $_GET['brand'] ) : '';
	if ( ! mwg_rg_is_privileged() ) {
		if ( $brand_raw !== '' && str_contains( $brand_raw, ';' ) ) {
			return true;
		}
		$ft = isset( $_GET['firearm-type'] ) ? $_GET['firearm-type'] : null;
		if ( $brand_raw !== '' && null !== $ft && '' !== $ft ) {
			return true;
		}
	}

	$mult = mwg_rg_is_privileged() ? 2 : 1;

	if ( strlen( $qs ) > ( MGW_RG_MAX_QUERY_LEN * $mult ) ) {
		return true;
	}

	if ( substr_count( $qs, ';' ) > ( MGW_RG_MAX_SEMICOLONS * $mult ) ) {
		return true;
	}

	if ( mwg_rg_brand_segment_count() > ( MGW_RG_MAX_BRAND_SEGMENTS * $mult ) ) {
		return true;
	}

	if ( mwg_rg_meaningful_query_key_count() > ( MGW_RG_MAX_FILTER_KEYS * $mult ) ) {
		return true;
	}

	return false;
}

/**
 * Run early — before WooCommerce runs heavy archive queries on init/template_redirect.
 */
add_action(
	'plugins_loaded',
	static function () {
		if ( ! mwg_rg_should_strip_query() ) {
			return;
		}

		$path = wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH );
		if ( ! is_string( $path ) || '' === $path ) {
			$path = '/';
		}

		$target = home_url( $path );
		$target = user_trailingslashit( $target );

		wp_safe_redirect( $target, 301 );
		exit;
	},
	-1000
);
