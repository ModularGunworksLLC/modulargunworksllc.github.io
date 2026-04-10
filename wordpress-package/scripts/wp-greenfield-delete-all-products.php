<?php
/**
 * Wipe all WooCommerce catalog data (products + variations) while keeping WordPress pages, users, and plugin settings.
 *
 * Run on the server (unbuffered output so the screen updates during long runs):
 *   stdbuf -oL -eL sudo /opt/bitnami/wp-cli/bin/wp eval-file \
 *     "$HOME/modulargunworksllc.github.io/wordpress-package/scripts/wp-greenfield-delete-all-products.php" \
 *     --path=/opt/bitnami/wordpress
 *
 * Large catalogs (10k+ SKUs) can take 30–90+ minutes. First line may take 1–2 minutes while WP loads.
 *
 * Set MGW_SKIP_LOOKUP_REBUILD=1 to skip the slow lookup table rebuild at the end.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! function_exists( 'wc_get_products' ) ) {
	echo "[greenfield] WooCommerce not loaded.\n";
	exit( 1 );
}

if ( function_exists( 'wp_is_cli' ) && wp_is_cli() ) {
	if ( function_exists( 'wp_raise_memory_limit' ) ) {
		wp_raise_memory_limit( 'admin' );
	}
	set_time_limit( 0 );
}

/**
 * @param string $msg
 */
function mgw_greenfield_log( $msg ) {
	echo $msg . "\n";
	if ( function_exists( 'ob_get_level' ) && ob_get_level() > 0 ) {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@ob_flush();
	}
	flush();
}

mgw_greenfield_log( '[greenfield] Starting catalog wipe. Large stores: expect long gaps between lines — not frozen.' );
mgw_greenfield_log( '[greenfield] First batch query can take 1–3 minutes.' );

$total_deleted = 0;
$batch         = 100;
$progress_every = 25;

mgw_greenfield_log( '[greenfield] Deleting products via WooCommerce API (proper variation cleanup)...' );

do {
	mgw_greenfield_log( '[greenfield] Fetching up to ' . $batch . ' product IDs...' );
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
	$n = 0;
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
		$n++;
		if ( $n % $progress_every === 0 ) {
			mgw_greenfield_log( sprintf( '[greenfield] ... deleted %d in this batch (running total: %d)', $n, $total_deleted ) );
		}
	}
	mgw_greenfield_log( sprintf( '[greenfield] Batch done; running total: %d', $total_deleted ) );
} while ( count( $ids ) >= $batch );

mgw_greenfield_log( '[greenfield] Removing stray product_variation posts...' );
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
	mgw_greenfield_log( sprintf( '[greenfield] Variation strays round %d, +%d (total %d)', $var_round, count( $stray ), $total_deleted ) );
	if ( $var_round > 500 ) {
		mgw_greenfield_log( '[greenfield] Warning: variation cleanup stopped after many rounds.' );
		break;
	}
} while ( ! empty( $stray ) );

mgw_greenfield_log( '[greenfield] Removing stray product posts...' );
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
	mgw_greenfield_log( sprintf( '[greenfield] Product strays round %d, +%d (total %d)', $prod_round, count( $stray ), $total_deleted ) );
	if ( $prod_round > 500 ) {
		mgw_greenfield_log( '[greenfield] Warning: product cleanup stopped after many rounds.' );
		break;
	}
} while ( ! empty( $stray ) );

update_option( 'mgw_chattanooga_batch_offset', 0 );
delete_option( 'mgw_chattanooga_feed_cache_file' );
delete_option( 'mgw_chattanooga_feed_fetched_at' );

wc_delete_product_transients();

$skip_lookup = ( getenv( 'MGW_SKIP_LOOKUP_REBUILD' ) === '1' || getenv( 'MGW_SKIP_LOOKUP_REBUILD' ) === 'true' );
if ( ! $skip_lookup && function_exists( 'wc_update_product_lookup_tables' ) ) {
	mgw_greenfield_log( '[greenfield] Rebuilding product lookup tables (can take several minutes; set MGW_SKIP_LOOKUP_REBUILD=1 to skip)...' );
	wc_update_product_lookup_tables();
	mgw_greenfield_log( '[greenfield] Lookup tables done.' );
} elseif ( $skip_lookup ) {
	mgw_greenfield_log( '[greenfield] Skipped lookup table rebuild (MGW_SKIP_LOOKUP_REBUILD).' );
}

mgw_greenfield_log( sprintf( '[greenfield] Finished. Total rows removed (products + stragglers): %d', $total_deleted ) );
mgw_greenfield_log( '[greenfield] Chattanooga offset cleared; feed cache option cleared.' );
mgw_greenfield_log( '[greenfield] Optional: wp wc tool run regenerate_product_lookup_tables --path=...' );
