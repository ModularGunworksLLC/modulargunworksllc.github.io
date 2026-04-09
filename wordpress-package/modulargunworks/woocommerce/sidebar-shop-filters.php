<?php
/**
 * Programmatic category-aware layered navigation blocks.
 *
 * This file renders additional facets above the widget sidebar when the
 * corresponding attribute taxonomies exist and contain terms.
 *
 * @package ModularGunworks
 */
defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'WC_Widget_Layered_Nav' ) ) {
	return;
}

$current_obj      = get_queried_object();
$current_cat_slug = '';
if ( $current_obj && isset( $current_obj->taxonomy ) && 'product_cat' === $current_obj->taxonomy && isset( $current_obj->slug ) ) {
	$current_cat_slug = sanitize_title( (string) $current_obj->slug );
}

$ammo_slugs = array(
	'ammunition',
	'handgun-ammunition',
	'rifle-ammunition',
	'shotgun-ammunition',
	'rimfire-ammunition',
	'rimfire',
	'handgun',
	'rifle',
	'shotgun',
);

$firearm_slugs = array(
	'firearms',
	'guns',
	'handguns',
	'rifles',
	'shotguns',
);

$widget_instances = get_option( 'widget_woocommerce_layered_nav', array() );
if ( ! is_array( $widget_instances ) ) {
	$widget_instances = array();
}

$existing_widget_attributes = array();
foreach ( $widget_instances as $instance ) {
	if ( ! is_array( $instance ) || empty( $instance['attribute'] ) ) {
		continue;
	}
	$existing_widget_attributes[] = sanitize_title( (string) $instance['attribute'] );
}
$existing_widget_attributes = array_values( array_unique( array_filter( $existing_widget_attributes ) ) );

$facet_definitions = array(
	'brand'        => array( 'title' => __( 'Brand', 'modulargunworks' ) ),
	'caliber'      => array( 'title' => __( 'Caliber', 'modulargunworks' ) ),
	'bullet_type'  => array( 'title' => __( 'Bullet Type', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'grain_weight' => array( 'title' => __( 'Grain Weight', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'capacity'     => array( 'title' => __( 'Capacity', 'modulargunworks' ) ),
	'rounds'       => array( 'title' => __( 'Rounds', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'gauge'        => array( 'title' => __( 'Gauge', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'velocity'     => array( 'title' => __( 'Velocity', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'shot_size'    => array( 'title' => __( 'Shot Size', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'casing'       => array( 'title' => __( 'Casing', 'modulargunworks' ), 'groups' => array( 'ammo' ) ),
	'product_line' => array( 'title' => __( 'Product Line', 'modulargunworks' ) ),
	'style'        => array( 'title' => __( 'Style', 'modulargunworks' ), 'groups' => array( 'firearms' ) ),
);

$layered_widget = new WC_Widget_Layered_Nav();

foreach ( $facet_definitions as $attribute_slug => $def ) {
	$attribute_slug = sanitize_title( (string) $attribute_slug );
	if ( '' === $attribute_slug ) {
		continue;
	}
	if ( in_array( $attribute_slug, $existing_widget_attributes, true ) ) {
		continue;
	}

	$groups = isset( $def['groups'] ) && is_array( $def['groups'] ) ? $def['groups'] : array();
	if ( ! empty( $groups ) ) {
		$is_ammo_cat    = '' !== $current_cat_slug && in_array( $current_cat_slug, $ammo_slugs, true );
		$is_firearm_cat = '' !== $current_cat_slug && in_array( $current_cat_slug, $firearm_slugs, true );
		if ( in_array( 'ammo', $groups, true ) && ! $is_ammo_cat ) {
			continue;
		}
		if ( in_array( 'firearms', $groups, true ) && ! $is_firearm_cat ) {
			continue;
		}
	}

	$taxonomy = wc_attribute_taxonomy_name( $attribute_slug );
	if ( ! taxonomy_exists( $taxonomy ) ) {
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
		'title'        => isset( $def['title'] ) ? (string) $def['title'] : ucwords( str_replace( '_', ' ', $attribute_slug ) ),
		'attribute'    => $attribute_slug,
		'display_type' => 'list',
		'query_type'   => 'or',
	);
	$layered_widget->widget( $args, array() );
}
