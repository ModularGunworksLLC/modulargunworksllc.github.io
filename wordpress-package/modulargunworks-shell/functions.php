<?php
/**
 * Modular Gunworks Shell — header/footer + WooCommerce wrapper + compliance essentials.
 */
defined( 'ABSPATH' ) || exit;

/**
 * Enqueue design system + WooCommerce polish (from legacy package assets).
 */
function mgw_shell_enqueue_assets() {
	$uri = get_template_directory_uri();

	wp_enqueue_style( 'mgw-shell-design-system', $uri . '/assets/css/design-system.css', array(), '1.0.0' );
	wp_enqueue_style( 'mgw-shell-components', $uri . '/assets/css/components.css', array( 'mgw-shell-design-system' ), '1.0.0' );
	wp_enqueue_style( 'mgw-shell-layout', $uri . '/assets/css/layout.css', array( 'mgw-shell-components' ), '1.0.0' );
	wp_enqueue_style( 'mgw-shell-product-tiles', $uri . '/assets/css/product-tiles.css', array( 'mgw-shell-layout' ), '1.0.0' );
	wp_enqueue_style( 'mgw-shell-extra', $uri . '/assets/css/shell.css', array( 'mgw-shell-layout' ), '1.0.0' );

	if ( is_front_page() ) {
		wp_enqueue_style( 'mgw-shell-front-page', $uri . '/assets/css/front-page.css', array( 'mgw-shell-layout' ), '1.0.0' );
	}

	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'mgw-shell-woocommerce', $uri . '/assets/css/woocommerce.css', array( 'mgw-shell-layout' ), '3.3.0' );
	}

	wp_enqueue_style(
		'font-awesome',
		'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
		array(),
		'6.4.0'
	);
}
add_action( 'wp_enqueue_scripts', 'mgw_shell_enqueue_assets' );

/**
 * Theme supports.
 */
function mgw_shell_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );

	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'modulargunworks-shell' ),
			'footer'  => __( 'Footer Menu', 'modulargunworks-shell' ),
		)
	);
}
add_action( 'after_setup_theme', 'mgw_shell_setup' );

/**
 * Cart count badge for AJAX add-to-cart.
 */
function mgw_shell_cart_fragments( $fragments ) {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return $fragments;
	}
	$count                                      = WC()->cart->get_cart_contents_count();
	$fragments['.cart-count-badge'] = '<span class="cart-count-badge" style="background:var(--color-primary);color:#fff;padding:2px 6px;border-radius:10px;font-size:0.75rem;">' . esc_html( (string) $count ) . '</span>';
	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'mgw_shell_cart_fragments' );

/**
 * FFL category detection.
 */
function mgw_shell_product_is_ffl_required( $product = null ) {
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

function mgw_shell_single_product_ffl_notice() {
	global $product;
	if ( ! mgw_shell_product_is_ffl_required( $product ) ) {
		return;
	}
	$ffl_page = get_page_by_path( 'firearm-transfer-guide' );
	$ffl_url  = $ffl_page ? get_permalink( $ffl_page ) : home_url( '/firearm-transfer-guide/' );
	?>
	<div class="mgw-ffl-notice mgw-ffl-notice-product">
		<i class="fas fa-exclamation-triangle"></i>
		<div>
			<strong><?php esc_html_e( 'FFL Required', 'modulargunworks-shell' ); ?></strong>
			<?php
			printf(
				wp_kses(
					__(
						'This item is a firearm. Federal law requires shipment to a licensed FFL dealer. We cannot ship firearms to residential addresses or P.O. boxes. You must have your firearm shipped to an FFL of your choice and complete the transfer there. <a href="%s" target="_blank" rel="noopener">Learn more</a>.',
						'modulargunworks-shell'
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
add_action( 'woocommerce_before_add_to_cart_form', 'mgw_shell_single_product_ffl_notice', 5 );

function mgw_shell_checkout_ffl_notice() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return;
	}
	$has_firearms = false;
	foreach ( WC()->cart->get_cart() as $item ) {
		if ( mgw_shell_product_is_ffl_required( $item['data'] ) ) {
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
		<p><?php esc_html_e( 'Your order contains firearms. The shipping address must be a licensed FFL dealer. We verify the FFL license before shipment.', 'modulargunworks-shell' ); ?></p>
	</div>
	<?php
}
add_action( 'woocommerce_before_checkout_form', 'mgw_shell_checkout_ffl_notice', 5 );

function mgw_shell_checkout_state_notice() {
	$state_url = get_page_by_path( 'state-restrictions' );
	$state_url = $state_url ? get_permalink( $state_url ) : home_url( '/state-restrictions/' );
	?>
	<div class="mgw-checkout-state-notice">
		<p>
			<?php
			printf(
				wp_kses(
					__(
						'You are responsible for complying with your state laws regarding firearms and ammunition. We may refuse or cancel orders to restricted jurisdictions. <a href="%s" target="_blank" rel="noopener">State Restrictions</a>.',
						'modulargunworks-shell'
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
add_action( 'woocommerce_before_checkout_form', 'mgw_shell_checkout_state_notice', 6 );

function mgw_shell_checkout_requires_shipping_method() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart || ! WC()->cart->needs_shipping() ) {
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
	if ( ! $has_selected ) {
		wc_add_notice( __( 'Please select a shipping method before placing your order.', 'modulargunworks-shell' ), 'error' );
	}
}
add_action( 'woocommerce_checkout_process', 'mgw_shell_checkout_requires_shipping_method', 5 );

/**
 * Legacy static .html routes → Woo (when option allows).
 */
function mgw_shell_legacy_static_route_map() {
	return array(
		'/shop/ammunition.html'       => '/product-category/ammunition/',
		'/shop/magazines.html'        => '/product-category/magazines/',
		'/shop/guns.html'             => '/product-category/firearms/',
		'/shop/gun-parts.html'        => '/product-category/gun-parts/',
		'/shop/gear.html'             => '/product-category/gear/',
		'/shop/optics.html'           => '/product-category/optics/',
		'/shop/reloading.html'        => '/product-category/reloading/',
		'/shop/outdoors.html'         => '/product-category/outdoors/',
		'/shop/brands.html'           => '/brands/',
		'/shop/brand-products.html'   => '/brands/',
		'/shop/sale.html'             => '/shop/?orderby=price',
		'/shop/search.html'           => '/shop/',
		'/search.html'                => '/shop/',
		'/shop/cart.html'             => '/cart/',
		'/shop/checkout.html'         => '/checkout/',
		'/cart.html'                  => '/cart/',
		'/checkout.html'              => '/checkout/',
		'/product-detail.html'        => '/shop/',
		'/product-view.html'          => '/shop/',
	);
}

function mgw_shell_get_product_url_by_sku( $sku ) {
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

function mgw_shell_redirect_legacy_static_routes() {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( (bool) get_option( 'mgw_enable_legacy_static_urls', false ) ) {
		return;
	}

	$path = wp_parse_url( add_query_arg( array() ), PHP_URL_PATH );
	$path = is_string( $path ) ? rtrim( $path, '/' ) : '';
	if ( '' === $path ) {
		$path = '/';
	}
	$path_lower = strtolower( $path );

	$map = mgw_shell_legacy_static_route_map();
	if ( isset( $map[ $path_lower ] ) ) {
		$target = $map[ $path_lower ];
		if ( '/product-detail.html' === $path_lower || '/product-view.html' === $path_lower ) {
			$sku         = isset( $_GET['sku'] ) ? sanitize_text_field( wp_unslash( $_GET['sku'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$product_url = mgw_shell_get_product_url_by_sku( $sku );
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
add_action( 'template_redirect', 'mgw_shell_redirect_legacy_static_routes', 1 );

/**
 * Core product categories for nav (same as prior theme).
 */
function mgw_shell_create_product_categories() {
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
				array( 'slug' => $slug )
			);
		}
	}
}
add_action( 'after_switch_theme', 'mgw_shell_create_product_categories' );

/**
 * Prefer native PDP → checkout flow over GunTab quick button when plugin is present.
 */
function mgw_shell_remove_guntab_quick_checkout() {
	if ( class_exists( 'GunTab\GunTabPaymentGateway' ) ) {
		remove_action( 'woocommerce_after_add_to_cart_button', array( \GunTab\GunTabPaymentGateway::class, 'add_quick_checkout' ), 10 );
	}
}
add_action( 'init', 'mgw_shell_remove_guntab_quick_checkout', 20 );
