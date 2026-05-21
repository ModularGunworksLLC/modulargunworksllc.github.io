<?php
/**
 * Modular Gunworks theme bootstrap.
 *
 * Normalization goals:
 * - Keep branding/layout in theme.
 * - Use plugin-native behavior for catalog filters, cart/checkout, and forms.
 * - Limit custom logic to visual polish and firearm compliance notices.
 */

defined( 'ABSPATH' ) || exit;

$mgw_theme_inc = trailingslashit( get_template_directory() ) . 'inc/store-info.php';
if ( is_readable( $mgw_theme_inc ) ) {
	require_once $mgw_theme_inc;
}

/**
 * Ensure WooCommerce Checkout uses the Terms page and requires acknowledgement (classic checkout).
 *
 * @return void
 */
function modulargunworks_wc_terms_page_bootstrap() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	if ( ! is_admin() ) {
		return;
	}
	if ( (int) get_option( 'woocommerce_terms_page_id', 0 ) > 0 ) {
		return;
	}
	$terms_page = get_page_by_path( 'terms' );
	if ( $terms_page instanceof WP_Post ) {
		update_option( 'woocommerce_terms_page_id', (int) $terms_page->ID );
	}
}
add_action( 'admin_init', 'modulargunworks_wc_terms_page_bootstrap', 30 );

/**
 * After theme update, map Terms page once if WooCommerce never set it.
 *
 * @return void
 */
function modulargunworks_wc_terms_after_switch() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	if ( (int) get_option( 'woocommerce_terms_page_id', 0 ) > 0 ) {
		return;
	}
	$terms_page = get_page_by_path( 'terms' );
	if ( $terms_page instanceof WP_Post ) {
		update_option( 'woocommerce_terms_page_id', (int) $terms_page->ID );
	}
}
add_action( 'after_switch_theme', 'modulargunworks_wc_terms_after_switch' );

/**
 * Enqueue shared theme assets.
 */
function modulargunworks_enqueue_assets() {
	$theme_uri = get_template_directory_uri();

	wp_enqueue_style( 'mgw-design-system', $theme_uri . '/assets/css/design-system.css', array(), '1.0.1' );
	wp_enqueue_style( 'mgw-components', $theme_uri . '/assets/css/components.css', array( 'mgw-design-system' ), '1.0.0' );
	wp_enqueue_style( 'mgw-layout', $theme_uri . '/assets/css/layout.css', array( 'mgw-components' ), '1.0.12' );
	wp_enqueue_style( 'mgw-product-tiles', $theme_uri . '/assets/css/product-tiles.css', array( 'mgw-layout' ), '1.0.0' );

	if ( is_front_page() ) {
		wp_enqueue_style( 'mgw-front-page', $theme_uri . '/assets/css/front-page.css', array( 'mgw-layout' ), '1.0.5' );
	}

	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'mgw-woocommerce', $theme_uri . '/assets/css/woocommerce.css', array( 'mgw-layout' ), '3.2.3' );
	}

	wp_enqueue_style(
		'font-awesome',
		'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
		array(),
		'6.4.0'
	);

	if ( ! class_exists( 'WooCommerce' ) ) {
		wp_enqueue_script( 'mgw-cart-fallback', $theme_uri . '/assets/js/cart.js', array(), '1.0.0', true );
	}
}
add_action( 'wp_enqueue_scripts', 'modulargunworks_enqueue_assets' );

/**
 * Restore Chattanooga CDN fallback images when products do not have WP attachments.
 */
function modulargunworks_get_chattanooga_image_url( $product ) {
	if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
		return '';
	}
	$url = $product->get_meta( '_chattanooga_image_url' );
	if ( is_string( $url ) && '' !== $url ) {
		return $url;
	}
	$parent_id = (int) $product->get_parent_id();
	if ( $parent_id > 0 ) {
		$parent = wc_get_product( $parent_id );
		if ( $parent ) {
			$url = $parent->get_meta( '_chattanooga_image_url' );
			if ( is_string( $url ) && '' !== $url ) {
				return $url;
			}
		}
	}
	if ( $product->is_type( 'variable' ) ) {
		foreach ( $product->get_children() as $child_id ) {
			$child = wc_get_product( (int) $child_id );
			if ( ! $child ) {
				continue;
			}
			$url = $child->get_meta( '_chattanooga_image_url' );
			if ( is_string( $url ) && '' !== $url ) {
				return $url;
			}
		}
	}
	return '';
}

function modulargunworks_is_wc_placeholder_attachment_id( $attachment_id ) {
	$aid = (int) $attachment_id;
	if ( $aid <= 0 ) {
		return false;
	}
	$opt = (int) get_option( 'woocommerce_placeholder_image', 0 );
	return $opt > 0 && $aid === $opt;
}

function modulargunworks_attachment_looks_like_placeholder( $attachment_id ) {
	$aid = (int) $attachment_id;
	if ( $aid <= 0 ) {
		return true;
	}
	if ( modulargunworks_is_wc_placeholder_attachment_id( $aid ) ) {
		return true;
	}
	$url = wp_get_attachment_url( $aid );
	return is_string( $url ) && false !== strpos( $url, 'woocommerce-placeholder' );
}

function modulargunworks_product_needs_chattanooga_image_fallback( $product, $image_html ) {
	if ( ! $product instanceof WC_Product ) {
		return false;
	}
	if ( '' === modulargunworks_get_chattanooga_image_url( $product ) ) {
		return false;
	}
	$id = (int) $product->get_image_id();
	if ( modulargunworks_attachment_looks_like_placeholder( $id ) ) {
		return true;
	}
	if ( is_string( $image_html ) && false !== strpos( $image_html, 'woocommerce-placeholder' ) ) {
		return true;
	}
	return false;
}

function modulargunworks_product_get_image_chattanooga( $image, $product, $size, $attr, $placeholder, $image_dup ) {
	unset( $placeholder, $image_dup, $size );
	if ( ! $product instanceof WC_Product ) {
		return $image;
	}
	if ( ! modulargunworks_product_needs_chattanooga_image_fallback( $product, $image ) ) {
		return $image;
	}
	$url = modulargunworks_get_chattanooga_image_url( $product );
	if ( '' === $url ) {
		return $image;
	}
	$url = esc_url( $url );
	if ( '' === $url ) {
		return $image;
	}
	$class = 'wp-post-image chattanooga-cdn-image attachment-woocommerce_thumbnail';
	if ( is_array( $attr ) && ! empty( $attr['class'] ) ) {
		$class .= ' ' . $attr['class'];
	}
	$alt = $product->get_name();
	if ( is_array( $attr ) && isset( $attr['alt'] ) && '' !== $attr['alt'] ) {
		$alt = $attr['alt'];
	}
	return sprintf(
		'<img src="%s" alt="%s" class="%s" loading="lazy" decoding="async" sizes="(max-width: 300px) 100vw, 300px" />',
		$url,
		esc_attr( (string) $alt ),
		esc_attr( trim( $class ) )
	);
}
add_filter( 'woocommerce_product_get_image', 'modulargunworks_product_get_image_chattanooga', 10, 6 );

function modulargunworks_single_product_image_thumbnail_html_chattanooga( $html, $post_thumbnail_id ) {
	global $product;
	if ( ! $product instanceof WC_Product ) {
		return $html;
	}
	$url = modulargunworks_get_chattanooga_image_url( $product );
	if ( '' === $url ) {
		return $html;
	}
	$tid = (int) $post_thumbnail_id;
	$replace = modulargunworks_attachment_looks_like_placeholder( $tid )
		|| ( false !== strpos( (string) $html, 'woocommerce-placeholder' ) );
	if ( ! $replace ) {
		return $html;
	}
	$url = esc_url( $url );
	if ( '' === $url ) {
		return $html;
	}
	$wrapper_classname = $product->is_type( 'variable' ) && ! empty( $product->get_visible_children() ) && '' !== $product->get_price()
		? 'woocommerce-product-gallery__image woocommerce-product-gallery__image--placeholder'
		: 'woocommerce-product-gallery__image--placeholder';
	return sprintf(
		'<div class="%1$s"><img src="%2$s" alt="%3$s" class="wp-post-image chattanooga-cdn-image" loading="lazy" decoding="async" /></div>',
		esc_attr( $wrapper_classname ),
		$url,
		esc_attr( $product->get_name() )
	);
}
add_filter( 'woocommerce_single_product_image_thumbnail_html', 'modulargunworks_single_product_image_thumbnail_html_chattanooga', 10, 2 );

/**
 * Some loop/template paths bypass woocommerce_product_get_image and call the post thumbnail stack directly.
 * Replace placeholder thumbnails with Chattanooga CDN image there as a final fallback.
 */
function modulargunworks_post_thumbnail_html_chattanooga( $html, $post_id, $post_thumbnail_id, $size, $attr ) {
	unset( $size );
	if ( get_post_type( $post_id ) !== 'product' ) {
		return $html;
	}
	$product = wc_get_product( (int) $post_id );
	if ( ! $product ) {
		return $html;
	}
	$url = modulargunworks_get_chattanooga_image_url( $product );
	if ( '' === $url ) {
		return $html;
	}
	if ( ! modulargunworks_attachment_looks_like_placeholder( $post_thumbnail_id ) && false === strpos( (string) $html, 'woocommerce-placeholder' ) ) {
		return $html;
	}
	$url = esc_url( $url );
	if ( '' === $url ) {
		return $html;
	}
	$class = 'wp-post-image chattanooga-cdn-image';
	if ( is_array( $attr ) && ! empty( $attr['class'] ) ) {
		$class .= ' ' . $attr['class'];
	}
	return sprintf(
		'<img src="%s" alt="%s" class="%s" loading="lazy" decoding="async" />',
		$url,
		esc_attr( $product->get_name() ),
		esc_attr( trim( $class ) )
	);
}
add_filter( 'post_thumbnail_html', 'modulargunworks_post_thumbnail_html_chattanooga', 10, 5 );

/**
 * Keep cart line-item thumbnails aligned with product image fallback behavior.
 */
function modulargunworks_cart_item_thumbnail( $thumbnail, $cart_item, $cart_item_key ) {
	unset( $cart_item_key );
	$product = isset( $cart_item['data'] ) ? $cart_item['data'] : null;
	if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
		return $thumbnail;
	}
	return $product->get_image( 'woocommerce_thumbnail' );
}
add_filter( 'woocommerce_cart_item_thumbnail', 'modulargunworks_cart_item_thumbnail', 10, 3 );

/**
 * Expose Chattanooga image URL in Woo REST product responses.
 */
function modulargunworks_rest_prepare_product_object( $response, $object, $request ) {
	unset( $request );
	if ( ! $response instanceof WP_REST_Response || ! $object || ! is_a( $object, 'WC_Product' ) ) {
		return $response;
	}
	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return $response;
	}
	$data['mgw_chattanooga_image_url'] = modulargunworks_get_chattanooga_image_url( $object );
	$response->set_data( $data );
	return $response;
}
add_filter( 'woocommerce_rest_prepare_product_object', 'modulargunworks_rest_prepare_product_object', 10, 3 );

/**
 * Shop / category / product-taxonomy archives: flex layout needs a wrapper that contains both
 * the primary column and the sidebar. Woo's default template closes #primary before the
 * sidebar runs, so without this the filters sit below the product grid (no visible "side" bar).
 */
function modulargunworks_is_wc_product_listing() {
	if ( ! function_exists( 'is_woocommerce' ) || ! is_woocommerce() ) {
		return false;
	}
	if ( is_product() || is_cart() || is_checkout() || is_account_page() ) {
		return false;
	}
	return ( function_exists( 'is_shop' ) && is_shop() ) || ( function_exists( 'is_product_taxonomy' ) && is_product_taxonomy() );
}

/**
 * @var int|null
 */
$GLOBALS['modulargunworks_wc_flex_open'] = null;

/**
 * @return void
 */
function modulargunworks_wc_flex_open() {
	if ( ! modulargunworks_is_wc_product_listing() ) {
		return;
	}
	$GLOBALS['modulargunworks_wc_flex_open'] = 1;
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<div class="mgw-shop-wrapper"><div class="mgw-shop-main"><div class="mgw-shop-content">';
}
add_action( 'woocommerce_before_main_content', 'modulargunworks_wc_flex_open', 1 );

/**
 * @return void
 */
function modulargunworks_wc_flex_close_content_col() {
	if ( empty( $GLOBALS['modulargunworks_wc_flex_open'] ) ) {
		return;
	}
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</div>';
}
add_action( 'woocommerce_after_main_content', 'modulargunworks_wc_flex_close_content_col', 15 );

/**
 * @return void
 */
function modulargunworks_wc_flex_close() {
	if ( empty( $GLOBALS['modulargunworks_wc_flex_open'] ) ) {
		return;
	}
	$GLOBALS['modulargunworks_wc_flex_open'] = null;
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</div></div>';
}
add_action( 'woocommerce_sidebar', 'modulargunworks_wc_flex_close', 9999 );

/**
 * Theme supports and menus.
 */
function modulargunworks_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'modulargunworks' ),
			'footer'  => __( 'Footer Menu', 'modulargunworks' ),
		)
	);
}
add_action( 'after_setup_theme', 'modulargunworks_theme_setup' );

/**
 * Register widget area used by WooCommerce native sidebar widgets.
 */
function modulargunworks_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Shop Sidebar', 'modulargunworks' ),
			'id'            => 'shop-sidebar',
			'description'   => __( 'WooCommerce filters and widgets for shop/category pages.', 'modulargunworks' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h3 class="widget_title">',
			'after_title'   => '</h3>',
		)
	);
}
add_action( 'widgets_init', 'modulargunworks_widgets_init' );

/**
 * Auto-provision native WooCommerce filter widgets in the shop sidebar (widget surface only).
 */
function modulargunworks_next_widget_instance_id( array $option ) {
	$max = 0;
	foreach ( array_keys( $option ) as $key ) {
		if ( is_numeric( $key ) ) {
			$max = max( $max, (int) $key );
		}
	}
	return $max + 1;
}

function modulargunworks_sidebar_has_widget_prefix( array $sidebar_widgets, $prefix ) {
	foreach ( $sidebar_widgets as $widget_id ) {
		if ( is_string( $widget_id ) && 0 === strpos( $widget_id, $prefix . '-' ) ) {
			return true;
		}
	}
	return false;
}

function modulargunworks_sidebar_widget_instance_ids( array $sidebar_widgets, $prefix ) {
	$ids = array();
	foreach ( $sidebar_widgets as $widget_id ) {
		if ( ! is_string( $widget_id ) || 0 !== strpos( $widget_id, $prefix . '-' ) ) {
			continue;
		}
		$ids[] = (int) substr( $widget_id, strlen( $prefix . '-' ) );
	}
	return array_values( array_unique( array_filter( $ids ) ) );
}

function modulargunworks_sidebar_has_layered_attribute_widget( array $sidebar_widgets, array $instances, $attribute_slug ) {
	foreach ( $sidebar_widgets as $widget_id ) {
		if ( ! is_string( $widget_id ) || 0 !== strpos( $widget_id, 'woocommerce_layered_nav-' ) ) {
			continue;
		}
		$instance_id = (int) substr( $widget_id, strlen( 'woocommerce_layered_nav-' ) );
		if ( isset( $instances[ $instance_id ]['attribute'] ) && $instances[ $instance_id ]['attribute'] === $attribute_slug ) {
			return true;
		}
	}
	return false;
}

function modulargunworks_ensure_shop_sidebar_filter_widgets() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	$done = (int) get_option( 'mgw_native_filter_widgets_version', 0 );
	if ( $done >= 4 ) {
		return;
	}

	$sidebars = get_option( 'sidebars_widgets', array() );
	if ( ! is_array( $sidebars ) ) {
		$sidebars = array();
	}
	if ( ! isset( $sidebars['shop-sidebar'] ) || ! is_array( $sidebars['shop-sidebar'] ) ) {
		$sidebars['shop-sidebar'] = array();
	}
	$shop_sidebar_widgets = $sidebars['shop-sidebar'];

	if ( ! modulargunworks_sidebar_has_widget_prefix( $shop_sidebar_widgets, 'woocommerce_layered_nav_filters' ) ) {
		$opt = get_option( 'widget_woocommerce_layered_nav_filters', array() );
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		if ( ! isset( $opt['_multiwidget'] ) ) {
			$opt['_multiwidget'] = 1;
		}
		$id = modulargunworks_next_widget_instance_id( $opt );
		$opt[ $id ] = array( 'title' => __( 'Active filters', 'modulargunworks' ) );
		update_option( 'widget_woocommerce_layered_nav_filters', $opt );
		$shop_sidebar_widgets[] = 'woocommerce_layered_nav_filters-' . $id;
	}

	if ( ! modulargunworks_sidebar_has_widget_prefix( $shop_sidebar_widgets, 'woocommerce_price_filter' ) ) {
		$opt = get_option( 'widget_woocommerce_price_filter', array() );
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		if ( ! isset( $opt['_multiwidget'] ) ) {
			$opt['_multiwidget'] = 1;
		}
		$id = modulargunworks_next_widget_instance_id( $opt );
		$opt[ $id ] = array( 'title' => __( 'Price', 'modulargunworks' ) );
		update_option( 'widget_woocommerce_price_filter', $opt );
		$shop_sidebar_widgets[] = 'woocommerce_price_filter-' . $id;
	}
	$price_opt = get_option( 'widget_woocommerce_price_filter', array() );
	if ( ! is_array( $price_opt ) ) {
		$price_opt = array();
	}
	if ( ! isset( $price_opt['_multiwidget'] ) ) {
		$price_opt['_multiwidget'] = 1;
	}
	foreach ( modulargunworks_sidebar_widget_instance_ids( $shop_sidebar_widgets, 'woocommerce_price_filter' ) as $id ) {
		if ( ! isset( $price_opt[ $id ] ) || ! is_array( $price_opt[ $id ] ) ) {
			$price_opt[ $id ] = array();
		}
		$price_opt[ $id ]['title'] = __( 'Price', 'modulargunworks' );
	}
	update_option( 'widget_woocommerce_price_filter', $price_opt );

	if ( ! modulargunworks_sidebar_has_widget_prefix( $shop_sidebar_widgets, 'woocommerce_product_categories' ) ) {
		$opt = get_option( 'widget_woocommerce_product_categories', array() );
		if ( ! is_array( $opt ) ) {
			$opt = array();
		}
		if ( ! isset( $opt['_multiwidget'] ) ) {
			$opt['_multiwidget'] = 1;
		}
		$id = modulargunworks_next_widget_instance_id( $opt );
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
	$product_categories_opt = get_option( 'widget_woocommerce_product_categories', array() );
	if ( ! is_array( $product_categories_opt ) ) {
		$product_categories_opt = array();
	}
	if ( ! isset( $product_categories_opt['_multiwidget'] ) ) {
		$product_categories_opt['_multiwidget'] = 1;
	}
	foreach ( modulargunworks_sidebar_widget_instance_ids( $shop_sidebar_widgets, 'woocommerce_product_categories' ) as $id ) {
		if ( ! isset( $product_categories_opt[ $id ] ) || ! is_array( $product_categories_opt[ $id ] ) ) {
			$product_categories_opt[ $id ] = array();
		}
		$product_categories_opt[ $id ] = array_merge(
			$product_categories_opt[ $id ],
			array(
				'title'              => __( 'Category', 'modulargunworks' ),
				'orderby'            => 'name',
				'dropdown'           => 0,
				'count'              => 1,
				'hierarchical'       => 1,
				'show_children_only' => 1,
				'hide_empty'         => 1,
				'max_depth'          => '',
			)
		);
	}
	update_option( 'widget_woocommerce_product_categories', $product_categories_opt );

	$layered_nav = get_option( 'widget_woocommerce_layered_nav', array() );
	if ( ! is_array( $layered_nav ) ) {
		$layered_nav = array();
	}
	if ( ! isset( $layered_nav['_multiwidget'] ) ) {
		$layered_nav['_multiwidget'] = 1;
	}

	$attributes = array(
		'brand'            => __( 'Brand', 'modulargunworks' ),
		'product_line'     => __( 'Brand Family', 'modulargunworks' ),
		'caliber'          => __( 'Caliber', 'modulargunworks' ),
		'gauge'            => __( 'Gauge', 'modulargunworks' ),
		'rounds'           => __( 'Rounds', 'modulargunworks' ),
		'bullet_type'      => __( 'Bullet Type', 'modulargunworks' ),
		'grain_weight'     => __( 'Grain', 'modulargunworks' ),
		'shot_size'        => __( 'Shot Size', 'modulargunworks' ),
		'shotshell_length' => __( 'Shotshell Length', 'modulargunworks' ),
		'shot_material'    => __( 'Shot Material', 'modulargunworks' ),
		'velocity'         => __( 'Velocity', 'modulargunworks' ),
		'lead_free'        => __( 'Lead Free', 'modulargunworks' ),
	);

	foreach ( $attributes as $attribute_slug => $title ) {
		$taxonomy = wc_attribute_taxonomy_name( $attribute_slug );
		if ( ! taxonomy_exists( $taxonomy ) ) {
			continue;
		}
		if ( modulargunworks_sidebar_has_layered_attribute_widget( $shop_sidebar_widgets, $layered_nav, $attribute_slug ) ) {
			continue;
		}
		$id = modulargunworks_next_widget_instance_id( $layered_nav );
		$layered_nav[ $id ] = array(
			'title'        => $title,
			'attribute'    => $attribute_slug,
			'display_type' => 'list',
			'query_type'   => 'or',
		);
		$shop_sidebar_widgets[] = 'woocommerce_layered_nav-' . $id;
	}
	foreach ( modulargunworks_sidebar_widget_instance_ids( $shop_sidebar_widgets, 'woocommerce_layered_nav' ) as $id ) {
		if ( ! isset( $layered_nav[ $id ] ) || ! is_array( $layered_nav[ $id ] ) ) {
			continue;
		}
		$layered_nav[ $id ] = array_merge(
			$layered_nav[ $id ],
			array(
				'display_type' => 'list',
				'query_type'   => 'or',
			)
		);
	}

	update_option( 'widget_woocommerce_layered_nav', $layered_nav );
	$sidebars['shop-sidebar'] = array_values( array_unique( $shop_sidebar_widgets ) );
	update_option( 'sidebars_widgets', $sidebars );

	update_option( 'mgw_native_filter_widgets_version', 5 );
	update_option( 'mgw_filter_surface_mode', 'widgets' );
	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients();
	}
}
add_action( 'admin_init', 'modulargunworks_ensure_shop_sidebar_filter_widgets', 30 );
add_action( 'init', 'modulargunworks_ensure_shop_sidebar_filter_widgets', 50 );

/**
 * Keep cart badge current when products are added via AJAX.
 */
function modulargunworks_cart_count_fragment( $fragments ) {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return $fragments;
	}

	$count                         = WC()->cart->get_cart_contents_count();
	$fragments['.cart-count-badge'] = '<span class="cart-count-badge" style="background:var(--color-primary);color:#fff;padding:2px 6px;border-radius:10px;font-size:0.75rem;">' . esc_html( $count ) . '</span>';

	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'modulargunworks_cart_count_fragment' );

/**
 * CPR sorting options for ammo-heavy catalogs.
 */
function modulargunworks_add_cpr_sort_options( $options ) {
	if ( ! is_array( $options ) ) {
		return $options;
	}
	$options['price_per_round']      = __( 'Sort by price per round: low to high', 'modulargunworks' );
	$options['price_per_round_desc'] = __( 'Sort by price per round: high to low', 'modulargunworks' );
	return $options;
}
add_filter( 'woocommerce_default_catalog_orderby_options', 'modulargunworks_add_cpr_sort_options' );
add_filter( 'woocommerce_catalog_orderby', 'modulargunworks_add_cpr_sort_options' );

function modulargunworks_catalog_ordering_args_cpr( $args, $orderby, $order ) {
	unset( $order );
	if ( 'price_per_round' === $orderby ) {
		$args['orderby']    = 'meta_value_num';
		$args['meta_key']   = '_price_per_round';
		$args['order']      = 'ASC';
		$args['meta_query'] = isset( $args['meta_query'] ) ? $args['meta_query'] : array();
		$args['meta_query'][] = array(
			'key'     => '_price_per_round',
			'compare' => 'EXISTS',
		);
		$args['meta_query'][] = array(
			'key'     => '_price_per_round',
			'value'   => 0,
			'compare' => '>',
		);
	} elseif ( 'price_per_round_desc' === $orderby ) {
		$args['orderby']    = 'meta_value_num';
		$args['meta_key']   = '_price_per_round';
		$args['order']      = 'DESC';
		$args['meta_query'] = isset( $args['meta_query'] ) ? $args['meta_query'] : array();
		$args['meta_query'][] = array(
			'key'     => '_price_per_round',
			'compare' => 'EXISTS',
		);
		$args['meta_query'][] = array(
			'key'     => '_price_per_round',
			'value'   => 0,
			'compare' => '>',
		);
	}
	return $args;
}
add_filter( 'woocommerce_get_catalog_ordering_args', 'modulargunworks_catalog_ordering_args_cpr', 10, 3 );

function modulargunworks_loop_shop_per_page( $per_page ) {
	if ( ! is_shop() && ! is_product_category() && ! is_tax( 'pa_brand' ) ) {
		return $per_page;
	}
	$requested = isset( $_GET['per_page'] ) ? absint( wp_unslash( $_GET['per_page'] ) ) : 0;
	if ( in_array( $requested, array( 24, 48, 96 ), true ) ) {
		return $requested;
	}
	return $per_page;
}
add_filter( 'loop_shop_per_page', 'modulargunworks_loop_shop_per_page', 20 );

/**
 * Firearms need explicit FFL notice.
 */
function modulargunworks_product_is_ffl_required( $product = null ) {
	if ( ! $product ) {
		global $product;
	}
	if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
		return false;
	}

	$terms = get_the_terms( $product->get_id(), 'product_cat' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return false;
	}

	$ffl_slugs = array( 'firearms', 'guns' );
	foreach ( $terms as $term ) {
		if ( in_array( strtolower( $term->slug ), $ffl_slugs, true ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Product-page FFL notice.
 */
function modulargunworks_single_product_ffl_notice() {
	global $product;
	if ( ! modulargunworks_product_is_ffl_required( $product ) ) {
		return;
	}

	$ffl_url = get_permalink( get_page_by_path( 'firearm-transfer-guide' ) );
	if ( ! $ffl_url ) {
		$ffl_url = home_url( '/firearm-transfer-guide/' );
	}
	?>
	<div class="mgw-ffl-notice mgw-ffl-notice-product">
		<i class="fas fa-exclamation-triangle"></i>
		<div>
			<strong><?php esc_html_e( 'FFL Required', 'modulargunworks' ); ?></strong>
			<?php
			printf(
				wp_kses(
					__(
						'This item is a firearm. Federal law requires shipment to a licensed FFL dealer. We cannot ship firearms to residential addresses or P.O. boxes. You must have your firearm shipped to an FFL of your choice and complete the transfer there. <a href="%s" target="_blank" rel="noopener">Learn more</a>.',
						'modulargunworks'
					),
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
							'rel'    => array(),
						),
					)
				),
				esc_url( $ffl_url )
			);
			?>
		</div>
	</div>
	<?php
}
add_action( 'woocommerce_before_add_to_cart_form', 'modulargunworks_single_product_ffl_notice', 5 );

/**
 * Checkout notice when cart contains firearms.
 */
function modulargunworks_checkout_ffl_notice() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return;
	}
	$has_firearms = false;
	foreach ( WC()->cart->get_cart() as $item ) {
		if ( modulargunworks_product_is_ffl_required( $item['data'] ) ) {
			$has_firearms = true;
			break;
		}
	}
	if ( ! $has_firearms ) {
		return;
	}
	?>
	<div class="mgw-checkout-ffl-notice">
		<i class="fas fa-info-circle"></i>
		<p><?php
			printf(
				wp_kses(
					__( 'Your order contains firearms. The shipping address must be a licensed FFL dealer. We verify the FFL license before shipment. Review failed-transfer and restocking terms in our <a href="%s">Terms</a>.', 'modulargunworks' ),
					array( 'a' => array( 'href' => array() ) ),
				),
				esc_url( home_url( '/terms/#mgw-shipping-failed-transfers' ) )
			);
		?></p>
	</div>
	<?php
}
add_action( 'woocommerce_before_checkout_form', 'modulargunworks_checkout_ffl_notice', 5 );

/**
 * State law reminder at checkout.
 */
function modulargunworks_checkout_state_notice() {
	$state_url = get_permalink( get_page_by_path( 'state-restrictions' ) );
	if ( ! $state_url ) {
		$state_url = home_url( '/state-restrictions/' );
	}
	?>
	<div class="mgw-checkout-state-notice">
		<p>
			<?php
			printf(
				wp_kses(
					__(
						'You are responsible for complying with your state laws regarding firearms and ammunition. We may refuse or cancel orders to restricted jurisdictions. <a href="%s" target="_blank" rel="noopener">State Restrictions</a>.',
						'modulargunworks'
					),
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
							'rel'    => array(),
						),
					)
				),
				esc_url( $state_url )
			);
			?>
		</p>
	</div>
	<?php
}
add_action( 'woocommerce_before_checkout_form', 'modulargunworks_checkout_state_notice', 6 );

/**
 * Show core WooCommerce terms checkbox when terms page exists.
 */
add_filter( 'woocommerce_checkout_terms_and_conditions_checkbox_enabled', '__return_true', 99 );

/**
 * Mandatory eligibility / policy affirmation (classic checkout).
 *
 * @return void
 */
function modulargunworks_checkout_eligibility_field() {
	if ( ! function_exists( 'is_checkout' ) || ! is_checkout() ) {
		return;
	}
	woocommerce_form_field(
		'mgw_firearms_eligibility',
		array(
			'type'     => 'checkbox',
			'class'    => array( 'form-row-wide', 'mgw-checkout-eligibility-field' ),
			'label'    => __( 'By placing this order I confirm that I meet the minimum age laws for firearms and ammunition in my order (for example 18+ for rifle/shotgun ammunition in many jurisdictions, 21+ for handguns, frames/receivers, and handgun ammunition where applicable), I am not legally prohibited under federal, state, or local law from receiving or possessing the items ordered, I am the actual purchaser/transferee, and I agree to the site Terms & Returns policies linked in the notices above.', 'modulargunworks' ),
			'required' => true,
		)
	);
}
add_action( 'woocommerce_review_order_before_submit', 'modulargunworks_checkout_eligibility_field', 5 );

/**
 * Validate eligibility checkbox at checkout.
 *
 * @return void
 */
function modulargunworks_checkout_eligibility_validate() {
	if ( ! isset( $_POST['mgw_firearms_eligibility'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		wc_add_notice( __( 'Please confirm eligibility and acknowledge our policies to complete your purchase.', 'modulargunworks' ), 'error' );
	}
}
add_action( 'woocommerce_checkout_process', 'modulargunworks_checkout_eligibility_validate', 5 );

/**
 * Require a selected shipping method before order placement when shipping is needed.
 */
function modulargunworks_checkout_requires_shipping_method() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return;
	}
	if ( ! WC()->cart->needs_shipping() ) {
		return;
	}
	$shipping_methods = isset( $_POST['shipping_method'] ) ? (array) wp_unslash( $_POST['shipping_method'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	$has_selected     = false;
	foreach ( $shipping_methods as $method ) {
		if ( is_string( $method ) && '' !== trim( $method ) ) {
			$has_selected = true;
			break;
		}
	}
	if ( ! $has_selected && WC()->session ) {
		$chosen = WC()->session->get( 'chosen_shipping_methods' );
		if ( is_array( $chosen ) ) {
			foreach ( $chosen as $method ) {
				if ( is_string( $method ) && '' !== trim( $method ) ) {
					$has_selected = true;
					break;
				}
			}
		}
	}
	if ( ! $has_selected ) {
		wc_add_notice( __( 'Please select a shipping method before placing your order.', 'modulargunworks' ), 'error' );
	}
}
add_action( 'woocommerce_checkout_process', 'modulargunworks_checkout_requires_shipping_method', 5 );

/**
 * Add-to-cart notice for firearm items.
 */
function modulargunworks_add_to_cart_ffl_notice( $cart_item_key, $product_id ) {
	unset( $cart_item_key );
	$product = wc_get_product( $product_id );
	if ( $product && modulargunworks_product_is_ffl_required( $product ) ) {
		wc_add_notice(
			__(
				'This firearm must be shipped to a licensed FFL dealer. See our Firearm Transfer Guide for details.',
				'modulargunworks'
			),
			'notice'
		);
	}
}
add_action( 'woocommerce_add_to_cart', 'modulargunworks_add_to_cart_ffl_notice', 10, 2 );

/**
 * Ensure core product categories exist for nav and merchandising.
 */
function modulargunworks_create_product_categories() {
	if ( ! taxonomy_exists( 'product_cat' ) ) {
		return;
	}

	$categories = array(
		'ammunition' => 'Ammunition',
		'magazines'  => 'Magazines',
		'firearms'   => 'Firearms',
		'gun-parts'  => 'Gun Parts',
		'gear'       => 'Gear',
		'optics'     => 'Optics',
		'reloading'  => 'Reloading',
		'outdoors'   => 'Outdoors',
		'brands'     => 'Brands',
	);

	foreach ( $categories as $slug => $name ) {
		if ( ! term_exists( $slug, 'product_cat' ) ) {
			wp_insert_term(
				$name,
				'product_cat',
				array(
					'slug' => $slug,
				)
			);
		}
	}
}
add_action( 'after_switch_theme', 'modulargunworks_create_product_categories' );

/**
 * Legacy static URL migration map to WooCommerce canonical routes.
 *
 * @return array<string,string>
 */
function modulargunworks_legacy_static_route_map() {
	return array(
		'/shop/ammunition.html'   => '/product-category/ammunition/',
		'/shop/magazines.html'    => '/product-category/magazines/',
		'/shop/guns.html'         => '/product-category/firearms/',
		'/shop/gun-parts.html'    => '/product-category/gun-parts/',
		'/shop/gear.html'         => '/product-category/gear/',
		'/shop/optics.html'       => '/product-category/optics/',
		'/shop/reloading.html'    => '/product-category/reloading/',
		'/shop/outdoors.html'     => '/product-category/outdoors/',
		'/shop/brands.html'       => '/brands/',
		'/shop/brand-products.html' => '/brands/',
		'/shop/sale.html'         => '/shop/?orderby=price',
		'/shop/search.html'       => '/shop/',
		'/search.html'            => '/shop/',
		'/shop/cart.html'         => '/cart/',
		'/shop/checkout.html'     => '/checkout/',
		'/cart.html'              => '/cart/',
		'/checkout.html'          => '/checkout/',
		'/product-detail.html'    => '/shop/',
		'/product-view.html'      => '/shop/',
	);
}

/**
 * Best-effort lookup: Chattanooga SKU query param to WooCommerce product URL.
 *
 * @param string $sku Product SKU.
 * @return string
 */
function modulargunworks_get_product_url_by_sku( $sku ) {
	$sku = is_string( $sku ) ? trim( $sku ) : '';
	if ( '' === $sku || ! function_exists( 'wc_get_product_id_by_sku' ) ) {
		return '';
	}
	$product_id = (int) wc_get_product_id_by_sku( $sku );
	if ( $product_id <= 0 ) {
		return '';
	}
	$url = get_permalink( $product_id );
	return is_string( $url ) ? $url : '';
}

/**
 * Legacy static URL mode is dangerous because old templates can expose non-retail pricing.
 * Require both DB option + explicit constant as a safety latch.
 */
function modulargunworks_legacy_static_urls_enabled() {
	$option_on = (bool) get_option( 'mgw_enable_legacy_static_urls', false );
	$constant_on = defined( 'MGW_ALLOW_LEGACY_STATIC_URLS' ) && MGW_ALLOW_LEGACY_STATIC_URLS;
	return $option_on && $constant_on;
}

/**
 * Warn admins when legacy URLs are enabled, or attempted without the constant.
 */
function modulargunworks_admin_notice_legacy_static_urls() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$option_on = (bool) get_option( 'mgw_enable_legacy_static_urls', false );
	if ( ! $option_on ) {
		return;
	}
	$constant_on = defined( 'MGW_ALLOW_LEGACY_STATIC_URLS' ) && MGW_ALLOW_LEGACY_STATIC_URLS;
	if ( $constant_on ) {
		echo '<div class="notice notice-warning"><p><strong>Legacy static URLs are enabled.</strong> This mode can expose outdated catalog logic. Disable it unless actively performing a migration rollback.</p></div>';
		return;
	}
	echo '<div class="notice notice-error"><p><strong>Legacy static URL option is ON but blocked.</strong> To intentionally allow it, define <code>MGW_ALLOW_LEGACY_STATIC_URLS</code> as true in <code>wp-config.php</code>. Redirect protection remains active.</p></div>';
}
add_action( 'admin_notices', 'modulargunworks_admin_notice_legacy_static_urls' );

/**
 * Redirect legacy static shop/cart/search/detail routes to canonical Woo pages.
 */
function modulargunworks_redirect_legacy_static_routes() {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( modulargunworks_legacy_static_urls_enabled() ) {
		return;
	}

	$path = parse_url( add_query_arg( array() ), PHP_URL_PATH );
	$path = is_string( $path ) ? rtrim( $path, '/' ) : '';
	if ( '' === $path ) {
		$path = '/';
	}
	$path_lower = strtolower( $path );

	$map = modulargunworks_legacy_static_route_map();
	if ( isset( $map[ $path_lower ] ) ) {
		$target = $map[ $path_lower ];
		if ( '/product-detail.html' === $path_lower || '/product-view.html' === $path_lower ) {
			$sku = isset( $_GET['sku'] ) ? sanitize_text_field( wp_unslash( $_GET['sku'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$product_url = modulargunworks_get_product_url_by_sku( $sku );
			if ( '' !== $product_url ) {
				wp_safe_redirect( $product_url, 301 );
				exit;
			}
		}
		wp_safe_redirect( home_url( $target ), 301 );
		exit;
	}

	if ( 0 === strpos( $path_lower, '/shop/' ) && preg_match( '/\.html$/', $path_lower ) ) {
		$shop_url = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/shop/' );
		wp_safe_redirect( $shop_url, 301 );
		exit;
	}
}
add_action( 'template_redirect', 'modulargunworks_redirect_legacy_static_routes', 1 );

/**
 * Add noindex header on legacy-static routes as migration defense-in-depth.
 */
function modulargunworks_legacy_noindex_header() {
	$path = parse_url( add_query_arg( array() ), PHP_URL_PATH );
	$path = is_string( $path ) ? strtolower( $path ) : '';
	if ( false !== strpos( $path, '.html' ) && ( 0 === strpos( $path, '/shop/' ) || '/product-detail.html' === $path || '/product-view.html' === $path ) ) {
		header( 'X-Robots-Tag: noindex, nofollow', true );
	}
}
add_action( 'send_headers', 'modulargunworks_legacy_noindex_header' );

/**
 * Intake forwarding: WordPress service request -> Bankledger pending work order.
 * Enabled via env/constant feature flag; intentionally server-to-server only.
 */
function modulargunworks_ledger_intake_enabled() {
	$constant_on = defined( 'MGW_LEDGER_INTAKE_ENABLED' ) && MGW_LEDGER_INTAKE_ENABLED;
	$env_on      = in_array( strtolower( (string) getenv( 'MGW_LEDGER_INTAKE_ENABLED' ) ), array( '1', 'true', 'yes', 'on' ), true );
	return $constant_on || $env_on;
}

function modulargunworks_ledger_intake_url() {
	if ( defined( 'MGW_LEDGER_INTAKE_URL' ) && is_string( MGW_LEDGER_INTAKE_URL ) && '' !== trim( MGW_LEDGER_INTAKE_URL ) ) {
		return trim( MGW_LEDGER_INTAKE_URL );
	}
	$env = getenv( 'MGW_LEDGER_INTAKE_URL' );
	return is_string( $env ) ? trim( $env ) : '';
}

function modulargunworks_ledger_intake_token() {
	if ( defined( 'MGW_LEDGER_INTAKE_TOKEN' ) && is_string( MGW_LEDGER_INTAKE_TOKEN ) && '' !== trim( MGW_LEDGER_INTAKE_TOKEN ) ) {
		return trim( MGW_LEDGER_INTAKE_TOKEN );
	}
	$env = getenv( 'MGW_LEDGER_INTAKE_TOKEN' );
	return is_string( $env ) ? trim( $env ) : '';
}

function modulargunworks_service_code_from_submission( array $posted ) {
	$raw_code = '';
	foreach ( array( 'service-code', 'service_code', 'service', 'service-requested' ) as $k ) {
		if ( isset( $posted[ $k ] ) && is_string( $posted[ $k ] ) && '' !== trim( $posted[ $k ] ) ) {
			$raw_code = sanitize_text_field( wp_unslash( $posted[ $k ] ) );
			break;
		}
	}
	$canon = strtolower( trim( $raw_code ) );
	$allowed = array(
		'ffl_transfers',
		'gunsmithing_basic',
		'svc_field_strip_clean',
		'svc_deep_clean',
		'svc_inspection',
		'svc_optics_mounting',
		'svc_sight_install',
		'gunsmithing_other',
	);
	if ( in_array( $canon, $allowed, true ) ) {
		return $canon;
	}

	$msg = '';
	if ( isset( $posted['your-message'] ) && is_string( $posted['your-message'] ) ) {
		$msg = strtolower( trim( wp_unslash( $posted['your-message'] ) ) );
	}
	if ( false !== strpos( $msg, 'ffl' ) || false !== strpos( $msg, 'transfer' ) ) {
		return 'ffl_transfers';
	}
	if ( false !== strpos( $msg, 'optic' ) || false !== strpos( $msg, 'bore' ) ) {
		return 'svc_optics_mounting';
	}
	if ( false !== strpos( $msg, 'sight' ) ) {
		return 'svc_sight_install';
	}
	if ( false !== strpos( $msg, 'deep clean' ) ) {
		return 'svc_deep_clean';
	}
	if ( false !== strpos( $msg, 'clean' ) || false !== strpos( $msg, 'field strip' ) ) {
		return 'svc_field_strip_clean';
	}
	if ( false !== strpos( $msg, 'inspect' ) || false !== strpos( $msg, 'function check' ) ) {
		return 'svc_inspection';
	}
	return 'gunsmithing_other';
}

function modulargunworks_forward_cf7_service_request_to_ledger( $contact_form ) {
	if ( ! modulargunworks_ledger_intake_enabled() ) {
		return;
	}
	if ( ! class_exists( 'WPCF7_Submission' ) || ! $contact_form ) {
		return;
	}
	$intake_url = modulargunworks_ledger_intake_url();
	$intake_token = modulargunworks_ledger_intake_token();
	if ( '' === $intake_url || '' === $intake_token ) {
		return;
	}

	$title = method_exists( $contact_form, 'title' ) ? (string) $contact_form->title() : '';
	if ( false === stripos( $title, 'service' ) ) {
		return;
	}
	$submission = WPCF7_Submission::get_instance();
	if ( ! $submission ) {
		return;
	}
	$posted = (array) $submission->get_posted_data();
	$name = isset( $posted['your-name'] ) ? sanitize_text_field( wp_unslash( $posted['your-name'] ) ) : '';
	$email = isset( $posted['your-email'] ) ? sanitize_email( wp_unslash( $posted['your-email'] ) ) : '';
	$phone = isset( $posted['your-phone'] ) ? sanitize_text_field( wp_unslash( $posted['your-phone'] ) ) : '';
	$message = isset( $posted['your-message'] ) ? sanitize_textarea_field( wp_unslash( $posted['your-message'] ) ) : '';
	$service_code = modulargunworks_service_code_from_submission( $posted );
	$service_label = isset( $posted['service-label'] ) ? sanitize_text_field( wp_unslash( $posted['service-label'] ) ) : '';
	$source_url = wp_get_referer();
	if ( ! is_string( $source_url ) ) {
		$source_url = '';
	}
	$ffl_count = isset( $posted['ffl-transfer-firearm-count'] ) ? absint( wp_unslash( $posted['ffl-transfer-firearm-count'] ) ) : 0;
	if ( $ffl_count < 1 ) {
		$ffl_count = 1;
	}

	$payload = array(
		'name' => $name,
		'email' => $email,
		'phone' => $phone,
		'serviceCode' => $service_code,
		'serviceLabel' => $service_label,
		'message' => $message,
		'source' => 'wordpress_cf7',
		'sourceUrl' => $source_url,
		'fflTransferFirearmCount' => $ffl_count,
	);
	$idempotency_key = hash(
		'sha256',
		wp_json_encode(
			array(
				'form' => method_exists( $contact_form, 'id' ) ? (int) $contact_form->id() : 0,
				'name' => strtolower( $name ),
				'email' => strtolower( $email ),
				'phone' => preg_replace( '/[^0-9]/', '', $phone ),
				'service' => $service_code,
				'message' => strtolower( $message ),
			)
		)
	);

	$response = wp_remote_post(
		$intake_url,
		array(
			'timeout' => 12,
			'headers' => array(
				'Content-Type' => 'application/json',
				'X-Intake-Token' => $intake_token,
				'X-Idempotency-Key' => $idempotency_key,
			),
			'body' => wp_json_encode( $payload ),
		)
	);
	if ( is_wp_error( $response ) ) {
		error_log( '[MGW intake] Failed to forward service request: ' . $response->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return;
	}
	$code = (int) wp_remote_retrieve_response_code( $response );
	if ( $code < 200 || $code >= 300 ) {
		error_log( '[MGW intake] Bankledger intake non-2xx: ' . $code ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}
add_action( 'wpcf7_mail_sent', 'modulargunworks_forward_cf7_service_request_to_ledger', 20, 1 );
add_action( 'wpcf7_before_send_mail', 'modulargunworks_forward_cf7_service_request_to_ledger', 20, 1 );

/**
 * For Service Request form, skip native WP mail and rely on Ledger intake email.
 * This avoids generic CF7 "send your message" errors when local mail transport is unavailable.
 */
function modulargunworks_cf7_skip_mail_for_service_request( $skip_mail, $contact_form ) {
	if ( $skip_mail ) {
		return true;
	}
	if ( ! modulargunworks_ledger_intake_enabled() || ! $contact_form ) {
		return $skip_mail;
	}
	$title = method_exists( $contact_form, 'title' ) ? (string) $contact_form->title() : '';
	if ( false !== stripos( $title, 'service' ) ) {
		return true;
	}
	return $skip_mail;
}
add_filter( 'wpcf7_skip_mail', 'modulargunworks_cf7_skip_mail_for_service_request', 20, 2 );

