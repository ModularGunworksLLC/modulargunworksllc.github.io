<?php
/**
 * WP-CLI operations script for full Woo storefront migration.
 *
 * Run with:
 *   wp eval-file wordpress-package/scripts/wp-storefront-migration-ops.php --path=/opt/bitnami/wordpress
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

function mgw_storefront_log( $msg ) {
	echo '[storefront-migration] ' . $msg . PHP_EOL;
}

function mgw_storefront_get_sidebar_widgets() {
	$sidebars = get_option( 'sidebars_widgets', array() );
	if ( ! is_array( $sidebars ) ) {
		$sidebars = array();
	}
	if ( ! isset( $sidebars['shop-sidebar'] ) || ! is_array( $sidebars['shop-sidebar'] ) ) {
		$sidebars['shop-sidebar'] = array();
	}
	return $sidebars;
}

function mgw_storefront_run_full_chattanooga_sync() {
	if ( ! class_exists( 'MGW_Chattanooga_Sync' ) ) {
		mgw_storefront_log( 'MGW_Chattanooga_Sync class not available; skipping full sync.' );
		return;
	}
	$sync = MGW_Chattanooga_Sync::instance();
	$guard = 500;
	$iteration = 0;
	do {
		$iteration++;
		$result = $sync->run_sync();
		$offset = (int) get_option( 'mgw_chattanooga_batch_offset', 0 );
		$message = isset( $result['message'] ) ? (string) $result['message'] : 'No message';
		mgw_storefront_log( sprintf( 'Sync batch %d complete: %s (offset=%d)', $iteration, $message, $offset ) );
		if ( $offset === 0 ) {
			break;
		}
	} while ( $iteration < $guard );

	if ( $iteration >= $guard ) {
		mgw_storefront_log( 'Sync guard reached; stopping to avoid infinite loop.' );
	}
}

function mgw_storefront_backfill_attributes() {
	if ( ! class_exists( 'MGW_Populate_Attrs' ) ) {
		mgw_storefront_log( 'MGW_Populate_Attrs class not available; skipping backfill.' );
		return;
	}
	$populate = MGW_Populate_Attrs::instance();
	$result   = $populate->run_backfill();
	$updated  = isset( $result['updated'] ) ? (int) $result['updated'] : 0;
	$skipped  = isset( $result['skipped'] ) ? (int) $result['skipped'] : 0;
	mgw_storefront_log( sprintf( 'Backfill complete: updated=%d skipped=%d', $updated, $skipped ) );
}

function mgw_storefront_verify_taxonomies() {
	$taxonomies = array(
		'pa_brand',
		'pa_caliber',
		'pa_bullet_type',
		'pa_grain_weight',
		'pa_capacity',
		'pa_rounds',
		'pa_gauge',
		'pa_velocity',
		'pa_shot_size',
		'pa_casing',
		'pa_product_line',
		'pa_style',
	);

	$report = array();
	foreach ( $taxonomies as $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			$report[ $taxonomy ] = array(
				'exists'    => false,
				'termCount' => 0,
			);
			continue;
		}
		$count = wp_count_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => true,
			)
		);
		$report[ $taxonomy ] = array(
			'exists'    => true,
			'termCount' => is_wp_error( $count ) ? 0 : (int) $count,
		);
	}

	update_option( 'mgw_storefront_taxonomy_report', $report );
	mgw_storefront_log( 'Updated option mgw_storefront_taxonomy_report with term counts.' );

	foreach ( $report as $taxonomy => $row ) {
		mgw_storefront_log(
			sprintf(
				'%s => exists=%s terms=%d',
				$taxonomy,
				$row['exists'] ? 'yes' : 'no',
				(int) $row['termCount']
			)
		);
	}
}

function mgw_storefront_verify_taxonomy_counts_by_category() {
	$cat_slugs = array(
		'ammunition',
		'magazines',
		'firearms',
		'gun-parts',
		'gear',
		'optics',
		'reloading',
		'outdoors',
	);
	$taxonomies = array(
		'pa_brand',
		'pa_caliber',
		'pa_bullet_type',
		'pa_grain_weight',
		'pa_capacity',
		'pa_rounds',
		'pa_gauge',
		'pa_velocity',
		'pa_shot_size',
		'pa_casing',
		'pa_product_line',
		'pa_style',
	);

	$report = array();

	foreach ( $cat_slugs as $cat_slug ) {
		$report[ $cat_slug ] = array();
		foreach ( $taxonomies as $taxonomy ) {
			if ( ! taxonomy_exists( $taxonomy ) ) {
				$report[ $cat_slug ][ $taxonomy ] = 0;
				continue;
			}

			$q = new WP_Query(
				array(
					'post_type'              => 'product',
					'post_status'            => 'publish',
					'posts_per_page'         => 1,
					'fields'                 => 'ids',
					'ignore_sticky_posts'    => true,
					'no_found_rows'          => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
					'tax_query'              => array(
						'relation' => 'AND',
						array(
							'taxonomy' => 'product_cat',
							'field'    => 'slug',
							'terms'    => array( $cat_slug ),
						),
						array(
							'taxonomy' => $taxonomy,
							'operator' => 'EXISTS',
						),
					),
				)
			);

			$report[ $cat_slug ][ $taxonomy ] = (int) $q->found_posts;
			wp_reset_postdata();
		}
	}

	update_option( 'mgw_storefront_category_taxonomy_report', $report );
	mgw_storefront_log( 'Updated option mgw_storefront_category_taxonomy_report.' );
	foreach ( $report as $cat_slug => $taxonomy_rows ) {
		$populated = array();
		foreach ( $taxonomy_rows as $taxonomy => $has_products ) {
			if ( (int) $has_products > 0 ) {
				$populated[] = $taxonomy;
			}
		}
		mgw_storefront_log(
			sprintf(
				'category=%s populated facets=%s',
				$cat_slug,
				empty( $populated ) ? 'none' : implode( ',', $populated )
			)
		);
	}
}

function mgw_storefront_dedupe_programmatic_facets() {
	$sidebars = mgw_storefront_get_sidebar_widgets();
	$shop_sidebar_widgets = $sidebars['shop-sidebar'];
	$layered_nav = get_option( 'widget_woocommerce_layered_nav', array() );
	if ( ! is_array( $layered_nav ) ) {
		$layered_nav = array();
	}
	if ( ! isset( $layered_nav['_multiwidget'] ) ) {
		$layered_nav['_multiwidget'] = 1;
	}

	$preferred_attrs = array(
		'brand',
		'caliber',
		'bullet_type',
		'grain_weight',
		'capacity',
		'rounds',
		'gauge',
		'velocity',
		'shot_size',
		'casing',
		'product_line',
		'style',
	);

	$seen = array();
	foreach ( $shop_sidebar_widgets as $widget_id ) {
		if ( ! is_string( $widget_id ) || 0 !== strpos( $widget_id, 'woocommerce_layered_nav-' ) ) {
			continue;
		}
		$instance_id = (int) substr( $widget_id, strlen( 'woocommerce_layered_nav-' ) );
		if ( $instance_id <= 0 || ! isset( $layered_nav[ $instance_id ]['attribute'] ) ) {
			continue;
		}
		$attr = sanitize_title( (string) $layered_nav[ $instance_id ]['attribute'] );
		if ( '' === $attr ) {
			continue;
		}
		if ( ! in_array( $attr, $preferred_attrs, true ) ) {
			continue;
		}
		if ( isset( $seen[ $attr ] ) ) {
			unset( $layered_nav[ $instance_id ] );
			$key = array_search( $widget_id, $shop_sidebar_widgets, true );
			if ( false !== $key ) {
				unset( $shop_sidebar_widgets[ $key ] );
			}
			continue;
		}
		$seen[ $attr ] = $instance_id;
		$layered_nav[ $instance_id ]['display_type'] = 'list';
		$layered_nav[ $instance_id ]['query_type'] = 'or';
	}

	$sidebars['shop-sidebar'] = array_values( $shop_sidebar_widgets );
	update_option( 'sidebars_widgets', $sidebars );
	update_option( 'widget_woocommerce_layered_nav', $layered_nav );
	mgw_storefront_log( 'Deduped layered-nav widget instances for preferred storefront facets.' );
}

function mgw_storefront_set_filter_surface_mode( $mode ) {
	$mode = is_string( $mode ) ? strtolower( trim( $mode ) ) : 'programmatic';
	if ( ! in_array( $mode, array( 'programmatic', 'widgets' ), true ) ) {
		$mode = 'programmatic';
	}
	update_option( 'mgw_filter_surface_mode', $mode );
	mgw_storefront_log( 'Set mgw_filter_surface_mode=' . $mode );
}

/**
 * Steps:
 * 1) Disable legacy static URL behavior in WP (canonical redirects enabled).
 * 2) Run full Chattanooga sync.
 * 3) Run attribute backfill.
 * 4) Verify taxonomy terms.
 * 5) Verify non-empty facet coverage by category.
 * 6) Dedupe layered facets.
 * 7) Set filter surface mode.
 * 8) Clear product transients.
 */
update_option( 'mgw_enable_legacy_static_urls', 0 );
mgw_storefront_log( 'Set mgw_enable_legacy_static_urls=0 (legacy static routes redirected to Woo).' );

mgw_storefront_run_full_chattanooga_sync();
mgw_storefront_backfill_attributes();
mgw_storefront_verify_taxonomies();
mgw_storefront_verify_taxonomy_counts_by_category();
mgw_storefront_dedupe_programmatic_facets();
mgw_storefront_set_filter_surface_mode( 'programmatic' );

if ( function_exists( 'wc_delete_product_transients' ) ) {
	wc_delete_product_transients();
	mgw_storefront_log( 'Cleared WooCommerce product transients.' );
}

flush_rewrite_rules( false );
mgw_storefront_log( 'Flushed rewrite rules.' );
mgw_storefront_log( 'Storefront migration operations complete.' );
