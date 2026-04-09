<?php
/**
 * Programmatic category-aware layered navigation blocks.
 *
 * Filters are scoped to the current storefront category and only displayed when
 * the currently listed products contain relevant terms for that taxonomy.
 *
 * @package ModularGunworks
 */
defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'WC_Widget_Layered_Nav' ) ) {
	return;
}

$filter_surface_mode = function_exists( 'modulargunworks_get_filter_surface_mode' )
	? modulargunworks_get_filter_surface_mode()
	: 'programmatic';
if ( 'widgets' === $filter_surface_mode ) {
	return;
}

/**
 * Resolve top-level catalog filter profile by category slug ancestry.
 *
 * @param array $context_slugs Current term slug + ancestors.
 * @return string
 */
function modulargunworks_sidebar_filter_profile( array $context_slugs ) {
	$profiles = array(
		'ammunition' => array( 'ammunition', 'handgun-ammunition', 'rifle-ammunition', 'shotgun-ammunition', 'rimfire-ammunition', 'rimfire', 'handgun', 'rifle', 'shotgun' ),
		'magazines'  => array( 'magazines', 'handgun-magazines', 'rifle-magazines', 'shotgun-magazines' ),
		'firearms'   => array( 'firearms', 'guns', 'handguns', 'rifles', 'shotguns' ),
		'gun-parts'  => array( 'gun-parts' ),
		'gear'       => array( 'gear' ),
		'optics'     => array( 'optics' ),
		'reloading'  => array( 'reloading' ),
		'outdoors'   => array( 'outdoors' ),
	);

	foreach ( $profiles as $profile => $slugs ) {
		if ( ! empty( array_intersect( $context_slugs, $slugs ) ) ) {
			return $profile;
		}
	}
	return 'default';
}

/**
 * True when displayed products include at least one term for taxonomy.
 *
 * @param string $taxonomy Woo taxonomy name.
 * @param array  $product_ids Product IDs currently listed.
 * @return bool
 */
function modulargunworks_sidebar_has_displayed_terms( $taxonomy, array $product_ids ) {
	if ( empty( $product_ids ) ) {
		return true;
	}
	$term_ids = wp_get_object_terms(
		$product_ids,
		$taxonomy,
		array(
			'fields' => 'ids',
		)
	);
	return ! is_wp_error( $term_ids ) && ! empty( $term_ids );
}

$current_obj    = get_queried_object();
$context_slugs  = array();
$current_cat_id = 0;
if ( $current_obj && isset( $current_obj->taxonomy ) && 'product_cat' === $current_obj->taxonomy && isset( $current_obj->slug ) ) {
	$current_cat_id  = (int) $current_obj->term_id;
	$context_slugs[] = sanitize_title( (string) $current_obj->slug );
	$ancestors       = get_ancestors( $current_cat_id, 'product_cat', 'taxonomy' );
	foreach ( $ancestors as $ancestor_id ) {
		$ancestor = get_term( (int) $ancestor_id, 'product_cat' );
		if ( $ancestor && ! is_wp_error( $ancestor ) ) {
			$context_slugs[] = sanitize_title( (string) $ancestor->slug );
		}
	}
}

$context_slugs = array_values( array_unique( array_filter( $context_slugs ) ) );
$profile       = modulargunworks_sidebar_filter_profile( $context_slugs );

$facets_by_profile = array(
	'ammunition' => array( 'brand', 'caliber', 'bullet_type', 'grain_weight', 'rounds', 'gauge', 'velocity', 'shot_size', 'casing', 'product_line' ),
	'magazines'  => array( 'brand', 'caliber', 'capacity', 'product_line' ),
	'firearms'   => array( 'brand', 'caliber', 'capacity', 'style', 'product_line' ),
	'gun-parts'  => array( 'brand', 'caliber', 'style', 'product_line' ),
	'gear'       => array( 'brand', 'style', 'product_line' ),
	'optics'     => array( 'brand', 'style', 'product_line' ),
	'reloading'  => array( 'brand', 'caliber', 'product_line' ),
	'outdoors'   => array( 'brand', 'style', 'product_line' ),
	'default'    => array( 'brand', 'caliber', 'capacity', 'product_line', 'style' ),
);

$facet_definitions = array(
	'brand'        => array( 'title' => __( 'Brand', 'modulargunworks' ) ),
	'caliber'      => array( 'title' => __( 'Caliber', 'modulargunworks' ) ),
	'bullet_type'  => array( 'title' => __( 'Bullet Type', 'modulargunworks' ) ),
	'grain_weight' => array( 'title' => __( 'Grain Weight', 'modulargunworks' ) ),
	'capacity'     => array( 'title' => __( 'Capacity', 'modulargunworks' ) ),
	'rounds'       => array( 'title' => __( 'Rounds', 'modulargunworks' ) ),
	'gauge'        => array( 'title' => __( 'Gauge', 'modulargunworks' ) ),
	'velocity'     => array( 'title' => __( 'Velocity', 'modulargunworks' ) ),
	'shot_size'    => array( 'title' => __( 'Shot Size', 'modulargunworks' ) ),
	'casing'       => array( 'title' => __( 'Casing', 'modulargunworks' ) ),
	'product_line' => array( 'title' => __( 'Product Line', 'modulargunworks' ) ),
	'style'        => array( 'title' => __( 'Style', 'modulargunworks' ) ),
);

$facets = isset( $facets_by_profile[ $profile ] ) ? $facets_by_profile[ $profile ] : $facets_by_profile['default'];

$widget_instances = get_option( 'widget_woocommerce_layered_nav', array() );
if ( ! is_array( $widget_instances ) ) {
	$widget_instances = array();
}
$sidebars = get_option( 'sidebars_widgets', array() );
$sidebars = is_array( $sidebars ) ? $sidebars : array();
$shop_sidebar_widgets = isset( $sidebars['shop-sidebar'] ) && is_array( $sidebars['shop-sidebar'] ) ? $sidebars['shop-sidebar'] : array();
$existing_widget_attributes = array();
foreach ( $shop_sidebar_widgets as $widget_id ) {
	if ( ! is_string( $widget_id ) || 0 !== strpos( $widget_id, 'woocommerce_layered_nav-' ) ) {
		continue;
	}
	$instance_id = (int) substr( $widget_id, strlen( 'woocommerce_layered_nav-' ) );
	if ( $instance_id <= 0 || empty( $widget_instances[ $instance_id ]['attribute'] ) ) {
		continue;
	}
	$existing_widget_attributes[] = sanitize_title( (string) $widget_instances[ $instance_id ]['attribute'] );
}
$existing_widget_attributes = array_values( array_unique( array_filter( $existing_widget_attributes ) ) );

global $wp_query;
$displayed_product_ids = array();
if ( isset( $wp_query->posts ) && is_array( $wp_query->posts ) ) {
	foreach ( $wp_query->posts as $post ) {
		if ( isset( $post->ID ) ) {
			$displayed_product_ids[] = (int) $post->ID;
		}
	}
}
$displayed_product_ids = array_values( array_unique( array_filter( $displayed_product_ids ) ) );

$layered_widget = new WC_Widget_Layered_Nav();

foreach ( $facets as $attribute_slug ) {
	$attribute_slug = sanitize_title( (string) $attribute_slug );
	if ( '' === $attribute_slug || ! isset( $facet_definitions[ $attribute_slug ] ) ) {
		continue;
	}
	if ( in_array( $attribute_slug, $existing_widget_attributes, true ) ) {
		continue;
	}

	$taxonomy = wc_attribute_taxonomy_name( $attribute_slug );
	if ( ! taxonomy_exists( $taxonomy ) ) {
		continue;
	}
	if ( ! modulargunworks_sidebar_has_displayed_terms( $taxonomy, $displayed_product_ids ) ) {
		continue;
	}

	$term_count = wp_count_terms(
		array(
			'taxonomy'   => $taxonomy,
			'hide_empty' => true,
		)
	);
	if ( is_wp_error( $term_count ) || (int) $term_count <= 0 ) {
		continue;
	}

	$args = array(
		'title'        => (string) $facet_definitions[ $attribute_slug ]['title'],
		'attribute'    => $attribute_slug,
		'display_type' => 'list',
		'query_type'   => 'or',
	);
	$layered_widget->widget( $args, array() );
}
