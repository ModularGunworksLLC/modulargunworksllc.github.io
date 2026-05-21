<?php
/**
 * One-time Woo product pricing repair:
 * - Customer-facing price must come from MSRP or MAP only.
 * - Dealer Price must never be used as effective _price.
 *
 * Run:
 *   wp eval-file wordpress-package/scripts/wp-repair-customer-pricing.php --path=/opt/bitnami/wordpress -- --dry-run
 *   wp eval-file wordpress-package/scripts/wp-repair-customer-pricing.php --path=/opt/bitnami/wordpress
 *
 * Safety gate in wp-config.php:
 *   define( 'MGW_ALLOW_PRICING_REPAIR_OPS', true );
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! defined( 'MGW_ALLOW_PRICING_REPAIR_OPS' ) || ! MGW_ALLOW_PRICING_REPAIR_OPS ) {
	echo '[pricing-repair] Blocked: define MGW_ALLOW_PRICING_REPAIR_OPS as true in wp-config.php before running this script.' . PHP_EOL;
	exit( 1 );
}

function mgw_price_repair_log( $msg ) {
	echo '[pricing-repair] ' . $msg . PHP_EOL;
	if ( function_exists( 'flush' ) ) {
		flush();
	}
}

function mgw_price_repair_float_or_zero( $value ) {
	if ( $value === null || $value === '' ) {
		return 0.0;
	}
	$s = is_string( $value ) ? trim( $value ) : (string) $value;
	if ( $s === '' || ! is_numeric( $s ) ) {
		return 0.0;
	}
	$f = (float) $s;
	return $f > 0 ? $f : 0.0;
}

function mgw_resolve_customer_price_from_meta( WC_Product $product ) {
	$msrp = mgw_price_repair_float_or_zero( $product->get_meta( '_msrp', true ) );
	$map  = mgw_price_repair_float_or_zero( $product->get_meta( '_map', true ) );
	if ( $msrp > 0 ) {
		return $msrp;
	}
	if ( $map > 0 ) {
		return $map;
	}
	return null;
}

function mgw_arg_present( $needle ) {
	$argv = isset( $_SERVER['argv'] ) && is_array( $_SERVER['argv'] ) ? $_SERVER['argv'] : array();
	foreach ( $argv as $arg ) {
		if ( $arg === $needle ) {
			return true;
		}
	}
	return false;
}

$dry_run = ( defined( 'MGW_PRICING_REPAIR_DRY_RUN' ) && MGW_PRICING_REPAIR_DRY_RUN ) || mgw_arg_present( '--dry-run' );
mgw_price_repair_log( 'Starting pricing repair. dry_run=' . ( $dry_run ? 'yes' : 'no' ) );

$stats = array(
	'total'            => 0,
	'fixed_to_msrpmap' => 0,
	'hidden_no_price'  => 0,
	'unchanged'        => 0,
	'errors'           => 0,
);

$page = 1;
$per_page = 250;

do {
	$product_ids = wc_get_products(
		array(
			'status' => array( 'publish', 'draft', 'pending', 'private' ),
			'limit'  => $per_page,
			'page'   => $page,
			'return' => 'ids',
		)
	);

	if ( empty( $product_ids ) ) {
		break;
	}

	foreach ( $product_ids as $product_id ) {
		$stats['total']++;
		$product = wc_get_product( (int) $product_id );
		if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
			$stats['errors']++;
			continue;
		}

		$resolved = mgw_resolve_customer_price_from_meta( $product );
		$current_regular = mgw_price_repair_float_or_zero( $product->get_regular_price() );
		$current_sale    = mgw_price_repair_float_or_zero( $product->get_sale_price() );
		$current_price   = mgw_price_repair_float_or_zero( $product->get_price() );
		$changed = false;

		try {
			if ( $resolved !== null && $resolved > 0 ) {
				if ( abs( $current_regular - $resolved ) > 0.0001 ) {
					$product->set_regular_price( (string) $resolved );
					$changed = true;
				}
				if ( $current_sale > 0 ) {
					$product->set_sale_price( '' );
					$changed = true;
				}
				if ( abs( $current_price - $resolved ) > 0.0001 ) {
					$product->set_price( (string) $resolved );
					$changed = true;
				}

				if ( $changed ) {
					$stats['fixed_to_msrpmap']++;
				} else {
					$stats['unchanged']++;
				}
			} else {
				$should_hide = false;
				if ( $current_regular > 0 || $current_sale > 0 || $current_price > 0 ) {
					$product->set_regular_price( '' );
					$product->set_sale_price( '' );
					$product->set_price( '' );
					$should_hide = true;
					$changed = true;
				}

				if ( $product->get_status() === 'publish' ) {
					$product->set_status( 'draft' );
					$should_hide = true;
					$changed = true;
				}
				if ( $product->get_catalog_visibility() !== 'hidden' ) {
					$product->set_catalog_visibility( 'hidden' );
					$should_hide = true;
					$changed = true;
				}

				if ( $should_hide ) {
					$stats['hidden_no_price']++;
				} else {
					$stats['unchanged']++;
				}
			}

			if ( $changed && ! $dry_run ) {
				$product->save();
			}
		} catch ( Throwable $t ) {
			$stats['errors']++;
			mgw_price_repair_log( sprintf( 'Error on product_id=%d sku=%s: %s', (int) $product_id, $product->get_sku(), $t->getMessage() ) );
		}
	}

	mgw_price_repair_log( sprintf( 'Processed page=%d count=%d total_so_far=%d', (int) $page, count( $product_ids ), (int) $stats['total'] ) );
	$page++;
} while ( true );

if ( ! $dry_run && function_exists( 'wc_delete_product_transients' ) ) {
	wc_delete_product_transients();
}

update_option( 'mgw_last_pricing_repair_stats', $stats );
update_option( 'mgw_last_pricing_repair_at', current_time( 'mysql' ) );
update_option( 'mgw_last_pricing_repair_dry_run', $dry_run ? '1' : '0' );

mgw_price_repair_log(
	sprintf(
		'Complete. total=%d fixed_to_msrpmap=%d hidden_no_price=%d unchanged=%d errors=%d',
		(int) $stats['total'],
		(int) $stats['fixed_to_msrpmap'],
		(int) $stats['hidden_no_price'],
		(int) $stats['unchanged'],
		(int) $stats['errors']
	)
);

