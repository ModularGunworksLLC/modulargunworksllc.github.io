<?php
/**
 * Wipe all WooCommerce catalog data (products + variations) while keeping WordPress pages, users, and plugin settings.
 *
 * Run on the server:
 *   wp eval-file wordpress-package/scripts/wp-greenfield-delete-all-products.php --path=/opt/bitnami/wordpress
 *
 * Does NOT delete orders, customers, or API keys. For a fuller commerce reset see docs/GREENFIELD-SERVER-STEPS.md.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! function_exists( 'wc_get_products' ) ) {
	echo "[greenfield] WooCommerce not loaded.\n";
	exit( 1 );
}

$total_deleted = 0;
$batch         = 150;

echo "[greenfield] Deleting products via WooCommerce API (proper variation cleanup)...\n";

do {
	$ids = wc_get_products(
		array(
			'limit'   => $batch,
			'status'  => 'any',
			'return'  => 'ids',
			'orderby' => 'ID',
			'order'   => 'ASC',
		)
	);
	if ( empty( $ids ) ) {
		break;
	}
	foreach ( $ids as $product_id ) {
		$product_id = (int) $product_id;
		if ( $product_id <= 0 ) {
			continue;
		}
		$product = wc_get_product( $product_id );
		if ( $product ) {
			$product->delete( true );
		} else {
			wp_delete_post( $product_id, true );
		}
		$total_deleted++;
	}
	echo sprintf( "[greenfield] Batch done; removed so far: %d\n", $total_deleted );
} while ( count( $ids ) >= $batch );

echo "[greenfield] Removing stray product_variation posts...\n";
$var_round = 0;
do {
	$stray = get_posts(
		array(
			'post_type'      => 'product_variation',
			'post_status'    => 'any',
			'posts_per_page' => 200,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	if ( empty( $stray ) ) {
		break;
	}
	foreach ( $stray as $vid ) {
		wp_delete_post( (int) $vid, true );
		$total_deleted++;
	}
	$var_round++;
	if ( $var_round > 500 ) {
		echo "[greenfield] Warning: variation cleanup stopped after many rounds.\n";
		break;
	}
} while ( ! empty( $stray ) );

echo "[greenfield] Removing stray product posts...\n";
$prod_round = 0;
do {
	$stray = get_posts(
		array(
			'post_type'      => 'product',
			'post_status'    => 'any',
			'posts_per_page' => 200,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	if ( empty( $stray ) ) {
		break;
	}
	foreach ( $stray as $pid ) {
		wp_delete_post( (int) $pid, true );
		$total_deleted++;
	}
	$prod_round++;
	if ( $prod_round > 500 ) {
		echo "[greenfield] Warning: product cleanup stopped after many rounds.\n";
		break;
	}
} while ( ! empty( $stray ) );

update_option( 'mgw_chattanooga_batch_offset', 0 );
delete_option( 'mgw_chattanooga_feed_cache_file' );
delete_option( 'mgw_chattanooga_feed_fetched_at' );

wc_delete_product_transients();

if ( function_exists( 'wc_update_product_lookup_tables' ) ) {
	echo "[greenfield] Rebuilding product lookup tables...\n";
	wc_update_product_lookup_tables();
}

echo sprintf( "[greenfield] Finished. Total rows removed (products + stragglers): %d\n", $total_deleted );
echo "[greenfield] Chattanooga offset cleared; feed cache option cleared (next sync downloads fresh CSV).\n";
echo "[greenfield] Optional: wp wc tool run regenerate_product_lookup_tables --path=...\n";
