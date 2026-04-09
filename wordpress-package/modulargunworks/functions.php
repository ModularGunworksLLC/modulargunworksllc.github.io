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

