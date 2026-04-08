<?php
/**
 * If Filter Everything is installed, it registers a hook that strips WooCommerce product SQL.
 * Removing that hook lets native layered nav / widgets drive the main product query.
 */
defined( 'ABSPATH' ) || exit;

final class MGW_WC_Native_Compat {
	public static function init() {
		add_action( 'init', [ __CLASS__, 'unhook_fe_product_clause_strip' ], 999 );
	}

	public static function unhook_fe_product_clause_strip() {
		if ( is_admin() ) {
			return;
		}
		remove_action( 'woocommerce_product_query', 'flrt_remove_product_query_post_clauses', 10 );
	}
}

MGW_WC_Native_Compat::init();
