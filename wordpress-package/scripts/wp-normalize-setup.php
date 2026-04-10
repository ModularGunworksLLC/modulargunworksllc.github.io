<?php
/**
 * WP-CLI eval-file script.
 *
 * Normalizes key WordPress/WooCommerce settings for the plugin-native MGW branch.
 * Run through:
 *   wp eval-file wordpress-package/scripts/wp-normalize-setup.php --path=/bitnami/wordpress
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

function mgw_norm_log( $message ) {
	echo '[normalize] ' . $message . PHP_EOL;
}

function mgw_norm_ensure_page( $option_name, $slug, $title, $content ) {
	$page_id = (int) get_option( $option_name, 0 );
	$page    = $page_id > 0 ? get_post( $page_id ) : null;

	if ( ! $page || 'page' !== $page->post_type ) {
		$existing = get_page_by_path( $slug );
		if ( $existing ) {
			$page_id = (int) $existing->ID;
		} else {
			$page_id = (int) wp_insert_post(
				array(
					'post_type'    => 'page',
					'post_status'  => 'publish',
					'post_title'   => $title,
					'post_name'    => $slug,
					'post_content' => $content,
				)
			);
		}
		update_option( $option_name, $page_id );
	}

	if ( $page_id > 0 ) {
		wp_update_post(
			array(
				'ID'           => $page_id,
				'post_status'  => 'publish',
				'post_title'   => $title,
				'post_name'    => $slug,
				'post_content' => $content,
			)
		);
	}

	return $page_id;
}

function mgw_norm_next_widget_id( array $option ) {
	$max = 0;
	foreach ( array_keys( $option ) as $key ) {
		if ( is_numeric( $key ) ) {
			$max = max( $max, (int) $key );
		}
	}
	return $max + 1;
}

function mgw_norm_sidebar_has_widget_prefix( array $sidebar_widgets, $prefix ) {
	foreach ( $sidebar_widgets as $widget_id ) {
		if ( is_string( $widget_id ) && 0 === strpos( $widget_id, $prefix . '-' ) ) {
			return true;
		}
	}
	return false;
}

function mgw_norm_sidebar_has_layered_attr( array $sidebar_widgets, array $instances, $attribute_slug ) {
	foreach ( $sidebar_widgets as $widget_id ) {
		if ( ! is_string( $widget_id ) || 0 !== strpos( $widget_id, 'woocommerce_layered_nav-' ) ) {
			continue;
		}
		$instance_id = (int) substr( $widget_id, strlen( 'woocommerce_layered_nav-' ) );
		if (
			isset( $instances[ $instance_id ]['attribute'] ) &&
			$instances[ $instance_id ]['attribute'] === $attribute_slug
		) {
			return true;
		}
	}
	return false;
}

function mgw_norm_ensure_cf7_form( $title, $form_markup ) {
	if ( ! post_type_exists( 'wpcf7_contact_form' ) ) {
		return 0;
	}

	$existing_posts = get_posts(
		array(
			'post_type'      => 'wpcf7_contact_form',
			'post_status'    => array( 'publish', 'draft', 'private' ),
			'posts_per_page' => -1,
		)
	);

	$form_id = 0;
	foreach ( $existing_posts as $post ) {
		if ( isset( $post->post_title ) && $post->post_title === $title ) {
			$form_id = (int) $post->ID;
			break;
		}
	}

	if ( $form_id > 0 ) {
		wp_update_post(
			array(
				'ID'           => $form_id,
				'post_status'  => 'publish',
				'post_title'   => $title,
				'post_content' => $form_markup,
			)
		);
		return $form_id;
	}

	return (int) wp_insert_post(
		array(
			'post_type'    => 'wpcf7_contact_form',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_content' => $form_markup,
		)
	);
}

if ( wp_get_theme()->get_stylesheet() !== 'modulargunworks' ) {
	switch_theme( 'modulargunworks' );
	mgw_norm_log( 'Activated theme: modulargunworks' );
} else {
	mgw_norm_log( 'Theme already active: modulargunworks' );
}

mgw_norm_ensure_page( 'woocommerce_shop_page_id', 'shop', 'Shop', '' );
mgw_norm_ensure_page( 'woocommerce_cart_page_id', 'cart', 'Cart', '[woocommerce_cart]' );
mgw_norm_ensure_page( 'woocommerce_checkout_page_id', 'checkout', 'Checkout', '[woocommerce_checkout]' );
mgw_norm_ensure_page( 'woocommerce_myaccount_page_id', 'my-account', 'My Account', '[woocommerce_my_account]' );
mgw_norm_log( 'Ensured WooCommerce core pages and shortcode content.' );

$template_map = array(
	'contact'    => 'page-contact.php',
	'services'   => 'page-services.php',
	'gunsmithing'=> 'page-gunsmithing.php',
	'cart'       => 'page-cart.php',
	'checkout'   => 'page-checkout.php',
);

foreach ( $template_map as $slug => $template_file ) {
	$page = get_page_by_path( $slug );
	if ( ! $page ) {
		continue;
	}
	update_post_meta( (int) $page->ID, '_wp_page_template', $template_file );
}
mgw_norm_log( 'Applied page templates for contact/services/cart/checkout.' );

if ( post_type_exists( 'wpcf7_contact_form' ) ) {
	$contact_form_markup = <<<CF7
<label> Name
    [text* your-name autocomplete:name] </label>

<label> Email
    [email* your-email autocomplete:email] </label>

<label> Message
    [textarea* your-message] </label>

[submit "Send Message"]
CF7;

	$service_form_markup = <<<CF7
<label> Name
    [text* your-name autocomplete:name] </label>

<label> Email
    [email* your-email autocomplete:email] </label>

<label> Phone
    [tel your-phone autocomplete:tel] </label>

<label> Service requested
    [textarea* your-message] </label>

[submit "Request Service"]
CF7;

	$contact_form_id = mgw_norm_ensure_cf7_form( 'Contact', $contact_form_markup );
	$service_form_id = mgw_norm_ensure_cf7_form( 'Service Request', $service_form_markup );
	mgw_norm_log( 'Ensured Contact Form 7 forms (Contact ID: ' . (int) $contact_form_id . ', Service Request ID: ' . (int) $service_form_id . ').' );
} else {
	mgw_norm_log( 'Contact Form 7 post type not available; skipped auto-creating forms.' );
}

$sidebars = get_option( 'sidebars_widgets', array() );
if ( ! is_array( $sidebars ) ) {
	$sidebars = array();
}
if ( ! isset( $sidebars['shop-sidebar'] ) || ! is_array( $sidebars['shop-sidebar'] ) ) {
	$sidebars['shop-sidebar'] = array();
}
$shop_sidebar_widgets = $sidebars['shop-sidebar'];

if ( ! mgw_norm_sidebar_has_widget_prefix( $shop_sidebar_widgets, 'woocommerce_layered_nav_filters' ) ) {
	$opt = get_option( 'widget_woocommerce_layered_nav_filters', array() );
	if ( ! is_array( $opt ) ) {
		$opt = array();
	}
	if ( ! isset( $opt['_multiwidget'] ) ) {
		$opt['_multiwidget'] = 1;
	}
	$id         = mgw_norm_next_widget_id( $opt );
	$opt[ $id ] = array(
		'title' => __( 'Active filters', 'modulargunworks' ),
	);
	update_option( 'widget_woocommerce_layered_nav_filters', $opt );
	$shop_sidebar_widgets[] = 'woocommerce_layered_nav_filters-' . $id;
}

if ( ! mgw_norm_sidebar_has_widget_prefix( $shop_sidebar_widgets, 'woocommerce_price_filter' ) ) {
	$opt = get_option( 'widget_woocommerce_price_filter', array() );
	if ( ! is_array( $opt ) ) {
		$opt = array();
	}
	if ( ! isset( $opt['_multiwidget'] ) ) {
		$opt['_multiwidget'] = 1;
	}
	$id         = mgw_norm_next_widget_id( $opt );
	$opt[ $id ] = array(
		'title' => __( 'Price', 'modulargunworks' ),
	);
	update_option( 'widget_woocommerce_price_filter', $opt );
	$shop_sidebar_widgets[] = 'woocommerce_price_filter-' . $id;
}

if ( ! mgw_norm_sidebar_has_widget_prefix( $shop_sidebar_widgets, 'woocommerce_product_categories' ) ) {
	$opt = get_option( 'widget_woocommerce_product_categories', array() );
	if ( ! is_array( $opt ) ) {
		$opt = array();
	}
	if ( ! isset( $opt['_multiwidget'] ) ) {
		$opt['_multiwidget'] = 1;
	}
	$id         = mgw_norm_next_widget_id( $opt );
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
	$shop_sidebar_widgets[] = 'woocommerce_product_categories-' . $id;
}

$layered_nav = get_option( 'widget_woocommerce_layered_nav', array() );
if ( ! is_array( $layered_nav ) ) {
	$layered_nav = array();
}
if ( ! isset( $layered_nav['_multiwidget'] ) ) {
	$layered_nav['_multiwidget'] = 1;
}

	$attr_map = array(
		'brand'        => __( 'Brand', 'modulargunworks' ),
		'caliber'      => __( 'Caliber', 'modulargunworks' ),
		'capacity'     => __( 'Capacity', 'modulargunworks' ),
		'bullet_type'  => __( 'Bullet Type', 'modulargunworks' ),
		'grain_weight' => __( 'Grain', 'modulargunworks' ),
		'rounds'       => __( 'Rounds', 'modulargunworks' ),
		'gauge'        => __( 'Gauge', 'modulargunworks' ),
		'velocity'     => __( 'Velocity', 'modulargunworks' ),
		'shot_size'    => __( 'Shot Size', 'modulargunworks' ),
		'casing'       => __( 'Casing', 'modulargunworks' ),
		'product_line' => __( 'Product Line', 'modulargunworks' ),
		'style'        => __( 'Style', 'modulargunworks' ),
	);

foreach ( $attr_map as $attribute_slug => $title ) {
	$taxonomy = wc_attribute_taxonomy_name( $attribute_slug );
	if ( ! taxonomy_exists( $taxonomy ) ) {
		continue;
	}
	if ( mgw_norm_sidebar_has_layered_attr( $shop_sidebar_widgets, $layered_nav, $attribute_slug ) ) {
		continue;
	}

	$id                 = mgw_norm_next_widget_id( $layered_nav );
	$layered_nav[ $id ] = array(
		'title'        => $title,
		'attribute'    => $attribute_slug,
		'display_type' => 'list',
		'query_type'   => 'or',
	);
	$shop_sidebar_widgets[] = 'woocommerce_layered_nav-' . $id;
}

update_option( 'widget_woocommerce_layered_nav', $layered_nav );
$sidebars['shop-sidebar'] = array_values( array_unique( $shop_sidebar_widgets ) );
update_option( 'sidebars_widgets', $sidebars );
mgw_norm_log( 'Configured shop sidebar with native WooCommerce widgets.' );

if ( function_exists( 'wc_delete_product_transients' ) ) {
	wc_delete_product_transients();
}
flush_rewrite_rules( false );
mgw_norm_log( 'Flushed rewrite rules and Woo transients.' );

mgw_norm_log( 'Normalization setup complete.' );

