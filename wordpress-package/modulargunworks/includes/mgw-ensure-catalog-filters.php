<?php
/**
 * Catalog filters: Woo global attributes + layered nav (facet order aligned with Chattanooga Shooting ammo catalog).
 * Goal: parity with https://chattanoogashooting.com/catalog/search/category_ammunition (Category tree + spec facets).
 * Data: facets only show values that exist on products — extend your CSV/API map + sync to assign pa_* terms.
 */
defined( 'ABSPATH' ) || exit;

const MGW_CATALOG_FILTER_INSTALL_VERSION = 3;

function mgw_catalog_filters_bootstrap() {
	add_action( 'admin_init', 'mgw_maybe_install_catalog_filters_and_widgets', 30 );
	add_action( 'woocommerce_product_query', 'mgw_product_query_on_sale', 35, 2 );
}
mgw_catalog_filters_bootstrap();

function mgw_maybe_install_catalog_filters_and_widgets() {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	$done = (int) get_option( 'mgw_catalog_filter_install_version', 0 );
	if ( $done >= MGW_CATALOG_FILTER_INSTALL_VERSION ) {
		return;
	}

	mgw_ensure_global_product_attributes();
	mgw_ensure_shop_sidebar_filter_widgets();

	update_option( 'mgw_catalog_filter_install_version', MGW_CATALOG_FILTER_INSTALL_VERSION );

	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients();
	}
	flush_rewrite_rules( false );
}

/**
 * Attribute slugs (max 28 chars) and labels. Creates global attributes if missing.
 *
 * @return array<int,array{name:string,slug:string,type:string,order_by:string,has_archives:bool}>
 */
function mgw_catalog_chattanooga_attribute_definitions() {
	return array(
		array(
			'name'         => __( 'Brand family', 'modulargunworks' ),
			'slug'         => 'brand-family',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Case material', 'modulargunworks' ),
			'slug'         => 'case-material',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Gauge', 'modulargunworks' ),
			'slug'         => 'gauge',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Load', 'modulargunworks' ),
			'slug'         => 'shell-load',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Rounds', 'modulargunworks' ),
			'slug'         => 'rounds',
			'type'         => 'select',
			'order_by'     => 'name_num',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Shot material', 'modulargunworks' ),
			'slug'         => 'shot-material',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Shot size', 'modulargunworks' ),
			'slug'         => 'shot-size',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Shotshell length', 'modulargunworks' ),
			'slug'         => 'shotshell-length',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Velocity', 'modulargunworks' ),
			'slug'         => 'velocity',
			'type'         => 'select',
			'order_by'     => 'name_num',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Country of origin', 'modulargunworks' ),
			'slug'         => 'country-of-origin',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Count', 'modulargunworks' ),
			'slug'         => 'piece-count',
			'type'         => 'select',
			'order_by'     => 'name_num',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Product class', 'modulargunworks' ),
			'slug'         => 'product-class',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Product line', 'modulargunworks' ),
			'slug'         => 'product-line',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Casing', 'modulargunworks' ),
			'slug'         => 'casing',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
		array(
			'name'         => __( 'Condition', 'modulargunworks' ),
			'slug'         => 'condition',
			'type'         => 'select',
			'order_by'     => 'name',
			'has_archives' => false,
		),
	);
}

function mgw_ensure_global_product_attributes() {
	if ( ! function_exists( 'wc_create_attribute' ) ) {
		return;
	}

	foreach ( mgw_catalog_chattanooga_attribute_definitions() as $args ) {
		if ( taxonomy_exists( wc_attribute_taxonomy_name( $args['slug'] ) ) ) {
			continue;
		}
		$r = wc_create_attribute( $args );
		if ( is_wp_error( $r ) && 'invalid_product_attribute_slug_already_exists' !== $r->get_error_code() ) {
			continue;
		}
	}

	delete_transient( 'wc_attribute_taxonomies' );
}

function mgw_widget_next_instance_id( $option ) {
	$max = 0;
	foreach ( array_keys( $option ) as $k ) {
		if ( is_numeric( $k ) ) {
			$max = max( $max, (int) $k );
		}
	}
	return $max + 1;
}

function mgw_sidebar_has_widget_prefix( $sidebar_widgets, $prefix ) {
	foreach ( $sidebar_widgets as $wid ) {
		if ( ! is_string( $wid ) ) {
			continue;
		}
		if ( strpos( $wid, $prefix . '-' ) === 0 ) {
			return true;
		}
	}
	return false;
}

function mgw_sidebar_has_layered_attr( $sidebar_widgets, $instances, $attr_slug ) {
	foreach ( $sidebar_widgets as $wid ) {
		if ( ! is_string( $wid ) || strpos( $wid, 'woocommerce_layered_nav-' ) !== 0 ) {
			continue;
		}
		$n = (int) substr( $wid, strlen( 'woocommerce_layered_nav-' ) );
		if ( isset( $instances[ $n ]['attribute'] ) && $instances[ $n ]['attribute'] === $attr_slug ) {
			return true;
		}
	}
	return false;
}

/**
 * Layered nav order mirrors Chattanooga facet sidebar (attributes only; Category stays a separate widget).
 *
 * @return array<string,string> slug => widget title
 */
function mgw_catalog_layered_nav_widgets_map() {
	return array(
		'brand'             => __( 'Brand', 'modulargunworks' ),
		'brand-family'      => __( 'Brand family', 'modulargunworks' ),
		'bullet_type'       => __( 'Bullet type', 'modulargunworks' ),
		'caliber'           => __( 'Caliber', 'modulargunworks' ),
		'case-material'     => __( 'Case material', 'modulargunworks' ),
		'condition'         => __( 'Condition', 'modulargunworks' ),
		'piece-count'       => __( 'Count', 'modulargunworks' ),
		'country-of-origin' => __( 'Country of origin', 'modulargunworks' ),
		'gauge'             => __( 'Gauge', 'modulargunworks' ),
		'grain_weight'      => __( 'Grain', 'modulargunworks' ),
		'shell-load'        => __( 'Load', 'modulargunworks' ),
		'rounds'            => __( 'Rounds', 'modulargunworks' ),
		'shot-material'     => __( 'Shot material', 'modulargunworks' ),
		'shot-size'         => __( 'Shot size', 'modulargunworks' ),
		'shotshell-length'  => __( 'Shotshell length', 'modulargunworks' ),
		'velocity'          => __( 'Velocity', 'modulargunworks' ),
		'product-class'     => __( 'Product class', 'modulargunworks' ),
		'capacity'          => __( 'Capacity', 'modulargunworks' ),
		'steel_case'        => __( 'Steel case', 'modulargunworks' ),
		'subsonic'          => __( 'Subsonic', 'modulargunworks' ),
		'vendor'            => __( 'Vendor', 'modulargunworks' ),
		'product-line'      => __( 'Product line', 'modulargunworks' ),
		'casing'            => __( 'Casing', 'modulargunworks' ),
	);
}

function mgw_ensure_shop_sidebar_filter_widgets() {
	$sidebars = get_option( 'sidebars_widgets', array() );
	if ( ! isset( $sidebars['shop-sidebar'] ) || ! is_array( $sidebars['shop-sidebar'] ) ) {
		$sidebars['shop-sidebar'] = array();
	}
	$bar =& $sidebars['shop-sidebar'];

	if ( ! mgw_sidebar_has_widget_prefix( $bar, 'woocommerce_layered_nav_filters' ) ) {
		$opt = get_option( 'widget_woocommerce_layered_nav_filters', array() );
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		if ( ! isset( $opt['_multiwidget'] ) ) {
			$opt['_multiwidget'] = 1;
		}
		$id         = mgw_widget_next_instance_id( $opt );
		$opt[ $id ] = array( 'title' => __( 'Active filters', 'modulargunworks' ) );
		update_option( 'widget_woocommerce_layered_nav_filters', $opt );
		$bar[] = 'woocommerce_layered_nav_filters-' . $id;
	}

	if ( ! mgw_sidebar_has_widget_prefix( $bar, 'woocommerce_price_filter' ) ) {
		$opt = get_option( 'widget_woocommerce_price_filter', array() );
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		if ( ! isset( $opt['_multiwidget'] ) ) {
			$opt['_multiwidget'] = 1;
		}
		$id         = mgw_widget_next_instance_id( $opt );
		$opt[ $id ] = array( 'title' => __( 'Price', 'modulargunworks' ) );
		update_option( 'widget_woocommerce_price_filter', $opt );
		$bar[] = 'woocommerce_price_filter-' . $id;
	}

	if ( ! mgw_sidebar_has_widget_prefix( $bar, 'woocommerce_product_categories' ) ) {
		$opt = get_option( 'widget_woocommerce_product_categories', array() );
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		if ( ! isset( $opt['_multiwidget'] ) ) {
			$opt['_multiwidget'] = 1;
		}
		$id         = mgw_widget_next_instance_id( $opt );
		$opt[ $id ] = array(
			'title'              => __( 'Category', 'modulargunworks' ),
			'orderby'            => 'name',
			'dropdown'           => 0,
			'count'              => 1,
			'hierarchical'       => 1,
			'show_children_only' => 0,
			'hide_empty'         => 1,
			'max_depth'          => '',
		);
		update_option( 'widget_woocommerce_product_categories', $opt );
		$bar[] = 'woocommerce_product_categories-' . $id;
	}

	$layers = mgw_catalog_layered_nav_widgets_map();

	$nav = get_option( 'widget_woocommerce_layered_nav', array() );
	if ( ! is_array( $nav ) ) {
		$nav = array();
	}
	if ( ! isset( $nav['_multiwidget'] ) ) {
		$nav['_multiwidget'] = 1;
	}

	foreach ( $layers as $slug => $title ) {
		if ( ! taxonomy_exists( wc_attribute_taxonomy_name( $slug ) ) ) {
			continue;
		}
		if ( mgw_sidebar_has_layered_attr( $bar, $nav, $slug ) ) {
			continue;
		}
		$id         = mgw_widget_next_instance_id( $nav );
		$nav[ $id ] = array(
			'title'        => $title,
			'attribute'    => $slug,
			'display_type' => 'list',
			'query_type'   => 'and',
		);
		$bar[] = 'woocommerce_layered_nav-' . $id;
	}

	update_option( 'widget_woocommerce_layered_nav', $nav );
	update_option( 'sidebars_widgets', $sidebars );
}

function mgw_product_query_on_sale( $q, $wc_query ) {
	unset( $wc_query );
	if ( is_admin() ) {
		return;
	}
	if ( empty( $_GET['on_sale'] ) || ! is_string( $_GET['on_sale'] ) ) {
		return;
	}
	if ( sanitize_text_field( wp_unslash( $_GET['on_sale'] ) ) !== '1' ) {
		return;
	}

	$meta_query = $q->get( 'meta_query' );
	if ( ! is_array( $meta_query ) ) {
		$meta_query = array();
	}

	$sale_clause = array(
		'relation' => 'OR',
		array(
			'key'     => '_sale_price',
			'value'   => 0,
			'compare' => '>',
			'type'    => 'numeric',
		),
		array(
			'key'     => '_min_variation_sale_price',
			'value'   => 0,
			'compare' => '>',
			'type'    => 'numeric',
		),
	);

	if ( empty( $meta_query ) ) {
		$q->set( 'meta_query', array( $sale_clause ) );
		return;
	}

	$q->set(
		'meta_query',
		array(
			'relation' => 'AND',
			$meta_query,
			$sale_clause,
		)
	);
}
