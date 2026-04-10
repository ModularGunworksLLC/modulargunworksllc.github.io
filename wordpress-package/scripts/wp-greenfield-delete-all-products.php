<?php
/**
 * Delete all WooCommerce products (posts + meta). Run via WP-CLI:
 *   wp eval-file wordpress-package/scripts/wp-greenfield-delete-all-products.php --path=/opt/bitnami/wordpress
 *
 * Resets Chattanooga batch offset to 0 so the next sync starts from the beginning.
 * Backup / snapshot the site first.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! function_exists( 'wc_get_products' ) ) {
	echo "[greenfield] WooCommerce not loaded.\n";
	exit( 1 );
}

$total_deleted = 0;
$batch         = 200;

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
		wp_delete_post( $product_id, true );
		$total_deleted++;
	}
	echo sprintf( "[greenfield] Deleted batch; running total: %d\n", $total_deleted );
} while ( count( $ids ) >= $batch );

update_option( 'mgw_chattanooga_batch_offset', 0 );
wc_delete_product_transients();

echo sprintf( "[greenfield] Finished. Total products removed: %d. Chattanooga offset reset to 0.\n", $total_deleted );
