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

/**
 * Enqueue shared theme assets.
 */
function modulargunworks_enqueue_assets() {
	$theme_uri = get_template_directory_uri();

	wp_enqueue_style( 'mgw-design-system', $theme_uri . '/assets/css/design-system.css', array(), '1.0.0' );
	wp_enqueue_style( 'mgw-components', $theme_uri . '/assets/css/components.css', array( 'mgw-design-system' ), '1.0.0' );
	wp_enqueue_style( 'mgw-layout', $theme_uri . '/assets/css/layout.css', array( 'mgw-components' ), '1.0.0' );
	wp_enqueue_style( 'mgw-product-tiles', $theme_uri . '/assets/css/product-tiles.css', array( 'mgw-layout' ), '1.0.0' );

	if ( is_front_page() ) {
		wp_enqueue_style( 'mgw-front-page', $theme_uri . '/assets/css/front-page.css', array( 'mgw-layout' ), '1.0.0' );
	}

	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'mgw-woocommerce', $theme_uri . '/assets/css/woocommerce.css', array( 'mgw-layout' ), '3.2.0' );
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

function modulargunworks_product_needs_chattanooga_image_fallback( $product, $image_html ) {
	if ( ! $product instanceof WC_Product ) {
		return false;
	}
	if ( '' === modulargunworks_get_chattanooga_image_url( $product ) ) {
		return false;
	}
	$id = (int) $product->get_image_id();
	if ( $id <= 0 ) {
		return true;
	}
	if ( modulargunworks_is_wc_placeholder_attachment_id( $id ) ) {
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
	$replace = ( $tid <= 0 )
		|| modulargunworks_is_wc_placeholder_attachment_id( $tid )
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
 * Auto-provision native WooCommerce filter widgets in the shop sidebar.
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
	if ( ! current_user_can( 'manage_woocommerce' ) || ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	$done = (int) get_option( 'mgw_native_filter_widgets_version', 0 );
	if ( $done >= 1 ) {
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

	$layered_nav = get_option( 'widget_woocommerce_layered_nav', array() );
	if ( ! is_array( $layered_nav ) ) {
		$layered_nav = array();
	}
	if ( ! isset( $layered_nav['_multiwidget'] ) ) {
		$layered_nav['_multiwidget'] = 1;
	}

	$attributes = array(
		'brand'        => __( 'Brand', 'modulargunworks' ),
		'caliber'      => __( 'Caliber', 'modulargunworks' ),
		'capacity'     => __( 'Capacity', 'modulargunworks' ),
		'bullet_type'  => __( 'Bullet Type', 'modulargunworks' ),
		'grain_weight' => __( 'Grain', 'modulargunworks' ),
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

	update_option( 'widget_woocommerce_layered_nav', $layered_nav );
	$sidebars['shop-sidebar'] = array_values( array_unique( $shop_sidebar_widgets ) );
	update_option( 'sidebars_widgets', $sidebars );

	update_option( 'mgw_native_filter_widgets_version', 1 );
	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients();
	}
}
add_action( 'admin_init', 'modulargunworks_ensure_shop_sidebar_filter_widgets', 30 );

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
		<p><?php esc_html_e( 'Your order contains firearms. The shipping address must be a licensed FFL dealer. We verify the FFL license before shipment.', 'modulargunworks' ); ?></p>
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
 * Remove GunTab quick checkout button from PDP for cleaner native flow.
 */
function modulargunworks_remove_guntab_quick_checkout_button() {
	if ( class_exists( 'GunTab\GunTabPaymentGateway' ) ) {
		remove_action( 'woocommerce_after_add_to_cart_button', array( \GunTab\GunTabPaymentGateway::class, 'add_quick_checkout' ), 10 );
	}
}
add_action( 'init', 'modulargunworks_remove_guntab_quick_checkout_button', 20 );

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

