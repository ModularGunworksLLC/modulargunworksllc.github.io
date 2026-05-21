<?php
/**
 * Plugin Name: MGW FFL & Restricted-State Shipping
 * Description: Shipping-class gates for restricted states, UPS vs local pickup rules, and FFL checkout fields with on-hold verification flow.
 * Version: 1.0.0
 * Author: Modular Gunworks
 *
 * Restricted-state matrix (shipping-class logic; not legal advice):
 * - CA, NY, WA, MA: block High-Cap + firearms group (firearms, handguns, rifle).
 * - IL: same (AR/AK should use Firearms class).
 * - NJ, CT, MD: block High-Cap only.
 * - Ammo-only to any listed state: UPS flat rate remains; local pickup removed unless billing is AL.
 * - Firearms group: only UPS (flat_rate) — local pickup removed everywhere.
 * - Ammo: local pickup only when billing state is AL.
 *
 * WooCommerce does not apply product-class rules per zone without code; a separate empty zone would block ammo.
 */
defined( 'ABSPATH' ) || exit;

/** US states where extra rules apply (state => 'hc' high-cap only | 'hc_fc' high-cap + firearms group). */
const MGW_FFL_RESTRICTED_MATRIX = array(
	'CA' => 'hc_fc',
	'NY' => 'hc_fc',
	'IL' => 'hc_fc',
	'WA' => 'hc_fc',
	'MA' => 'hc_fc',
	'NJ' => 'hc',
	'CT' => 'hc',
	'MD' => 'hc',
);

const MGW_FFL_HOME_STATE = 'AL';

/**
 * @return string[]
 */
function mgw_ffl_cart_shipping_class_slugs() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return array();
	}
	$out = array();
	foreach ( WC()->cart->get_cart() as $item ) {
		$ids = array();
		if ( ! empty( $item['variation_id'] ) ) {
			$ids[] = (int) $item['variation_id'];
		}
		$ids[] = (int) $item['product_id'];
		foreach ( $ids as $pid ) {
			if ( $pid <= 0 ) {
				continue;
			}
			$slugs = wp_get_post_terms( $pid, 'product_shipping_class', array( 'fields' => 'slugs' ) );
			if ( is_wp_error( $slugs ) || ! is_array( $slugs ) ) {
				continue;
			}
			foreach ( $slugs as $s ) {
				$out[] = (string) $s;
			}
		}
	}
	return array_values( array_unique( $out ) );
}

/**
 * @param string[] $slugs
 */
function mgw_ffl_has_firearms_group( array $slugs ) {
	return (bool) array_intersect( $slugs, array( 'firearms', 'handguns', 'rifle' ) );
}

/**
 * @param string[] $slugs
 */
function mgw_ffl_has_high_cap( array $slugs ) {
	return in_array( 'high-cap', $slugs, true );
}

/**
 * @param string[] $slugs
 */
function mgw_ffl_has_ammo( array $slugs ) {
	return (bool) array_intersect( $slugs, array( 'ammo', 'ammunition' ) );
}

/**
 * @param string   $state Two-letter.
 * @param string[] $slugs
 */
function mgw_ffl_restricted_blocks_all_rates( $state, array $slugs ) {
	$state = strtoupper( (string) $state );
	if ( '' === $state || ! isset( MGW_FFL_RESTRICTED_MATRIX[ $state ] ) ) {
		return false;
	}
	$mode = MGW_FFL_RESTRICTED_MATRIX[ $state ];
	$hc   = mgw_ffl_has_high_cap( $slugs );
	$fc   = mgw_ffl_has_firearms_group( $slugs );
	if ( 'hc' === $mode ) {
		return $hc;
	}
	if ( 'hc_fc' === $mode ) {
		return $hc || $fc;
	}
	return false;
}

/**
 * @param WC_Shipping_Rate[] $rates
 * @return WC_Shipping_Rate[]
 */
function mgw_ffl_filter_package_rates( $rates, $package ) {
	if ( ! is_array( $rates ) || empty( $rates ) ) {
		return $rates;
	}
	$country = isset( $package['destination']['country'] ) ? strtoupper( (string) $package['destination']['country'] ) : '';
	$state   = isset( $package['destination']['state'] ) ? strtoupper( (string) $package['destination']['state'] ) : '';
	if ( 'US' !== $country ) {
		return $rates;
	}

	$slugs        = mgw_ffl_cart_shipping_class_slugs();
	$billing_state = '';
	if ( function_exists( 'WC' ) && WC()->customer ) {
		$billing_state = strtoupper( (string) WC()->customer->get_billing_state() );
	}

	if ( mgw_ffl_restricted_blocks_all_rates( $state, $slugs ) ) {
		return array();
	}

	$has_fc = mgw_ffl_has_firearms_group( $slugs );
	$has_am = mgw_ffl_has_ammo( $slugs );

	foreach ( $rates as $key => $rate ) {
		if ( ! $rate instanceof WC_Shipping_Rate ) {
			continue;
		}
		$rid = $rate->get_id();
		// Remove local pickup for firearms anywhere, or for ammo unless billing in AL.
		if ( false !== strpos( $rid, 'local_pickup' ) ) {
			if ( $has_fc ) {
				unset( $rates[ $key ] );
				continue;
			}
			if ( $has_am && MGW_FFL_HOME_STATE !== $billing_state ) {
				unset( $rates[ $key ] );
			}
		}
	}

	return $rates;
}
add_filter( 'woocommerce_package_rates', 'mgw_ffl_filter_package_rates', 9999, 2 );

/**
 * Dealer / FFL fields (shown when cart contains a regulated firearm group class).
 */
function mgw_ffl_checkout_fields() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return;
	}
	$slugs = mgw_ffl_cart_shipping_class_slugs();
	if ( ! mgw_ffl_has_firearms_group( $slugs ) ) {
		return;
	}
	?>
	<div id="mgw_ffl_checkout_block" class="woocommerce-additional-fields" style="margin:1.25rem 0;padding:1rem;border:1px solid #c9a227;background:#fffdf5;">
		<h3><?php esc_html_e( 'FFL shipment required', 'mgw-ffl' ); ?></h3>
		<p><strong><?php esc_html_e( 'Firearms must ship to an FFL. If you are not an FFL, provide your receiving dealer’s information below. Orders are held until we verify the license (e.g. ATF EZ Check).', 'mgw-ffl' ); ?></strong></p>
		<p class="form-row form-row-wide" id="mgw_ffl_dealer_name_field">
			<label for="mgw_ffl_dealer_name"><?php esc_html_e( 'Receiving FFL / dealer name', 'mgw-ffl' ); ?>&nbsp;<abbr class="required" title="required">*</abbr></label>
			<input type="text" class="input-text" name="mgw_ffl_dealer_name" id="mgw_ffl_dealer_name" value="<?php echo isset( $_POST['mgw_ffl_dealer_name'] ) ? esc_attr( wp_unslash( (string) $_POST['mgw_ffl_dealer_name'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing ?>" />
		</p>
		<p class="form-row form-row-wide" id="mgw_ffl_dealer_contact_field">
			<label for="mgw_ffl_dealer_contact"><?php esc_html_e( 'Dealer phone or email', 'mgw-ffl' ); ?></label>
			<input type="text" class="input-text" name="mgw_ffl_dealer_contact" id="mgw_ffl_dealer_contact" value="<?php echo isset( $_POST['mgw_ffl_dealer_contact'] ) ? esc_attr( wp_unslash( (string) $_POST['mgw_ffl_dealer_contact'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing ?>" />
		</p>
		<p class="form-row form-row-wide" id="mgw_ffl_ffl_file_field">
			<label for="mgw_ffl_ffl_file"><?php esc_html_e( 'FFL license copy (optional)', 'mgw-ffl' ); ?></label>
			<input type="file" name="mgw_ffl_ffl_file" id="mgw_ffl_ffl_file" accept=".pdf,.jpg,.jpeg,.png" />
		</p>
	</div>
	<?php
}
add_action( 'woocommerce_after_order_notes', 'mgw_ffl_checkout_fields', 15 );

/**
 * Validate dealer name when firearms are in the cart.
 */
function mgw_ffl_validate_checkout() {
	$slugs = mgw_ffl_cart_shipping_class_slugs();
	if ( ! mgw_ffl_has_firearms_group( $slugs ) ) {
		return;
	}
	$name = isset( $_POST['mgw_ffl_dealer_name'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['mgw_ffl_dealer_name'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
	if ( '' === trim( $name ) ) {
		wc_add_notice( __( 'Please enter the receiving FFL / dealer name for your firearm shipment.', 'mgw-ffl' ), 'error' );
	}
}
add_action( 'woocommerce_checkout_process', 'mgw_ffl_validate_checkout', 15 );

/**
 * Persist checkout meta + optional FFL upload.
 *
 * @param int        $order_id Order ID.
 * @param array      $posted   Posted data.
 * @param WC_Order   $order    Order object.
 */
function mgw_ffl_save_order_meta( $order_id, $posted, $order ) {
	unset( $posted );
	if ( ! $order instanceof WC_Order ) {
		return;
	}
	$slugs = array();
	foreach ( $order->get_items() as $item ) {
		$pid = $item->get_variation_id() ? $item->get_variation_id() : $item->get_product_id();
		$t   = wp_get_post_terms( (int) $pid, 'product_shipping_class', array( 'fields' => 'slugs' ) );
		if ( is_array( $t ) ) {
			$slugs = array_merge( $slugs, $t );
		}
	}
	$slugs = array_values( array_unique( $slugs ) );

	if ( isset( $_POST['mgw_ffl_dealer_name'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$order->update_meta_data( '_mgw_ffl_dealer_name', sanitize_text_field( wp_unslash( (string) $_POST['mgw_ffl_dealer_name'] ) ) );
	}
	if ( isset( $_POST['mgw_ffl_dealer_contact'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$order->update_meta_data( '_mgw_ffl_dealer_contact', sanitize_text_field( wp_unslash( (string) $_POST['mgw_ffl_dealer_contact'] ) ) );
	}

	if ( ! empty( $_FILES['mgw_ffl_ffl_file']['name'] ) && ! empty( $_FILES['mgw_ffl_ffl_file']['tmp_name'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$file = $_FILES['mgw_ffl_ffl_file']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$chk  = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'] );
		$ext  = is_array( $chk ) && ! empty( $chk['ext'] ) ? $chk['ext'] : '';
		if ( ! in_array( strtolower( $ext ), array( 'pdf', 'jpg', 'jpeg', 'png' ), true ) ) {
			$order->add_order_note( 'FFL file upload rejected: unsupported type.' );
		} else {
			$upload = wp_upload_dir();
			$dir    = trailingslashit( $upload['basedir'] ) . 'mgw-ffl-private';
			if ( wp_mkdir_p( $dir ) ) {
				if ( ! file_exists( $dir . '/.htaccess' ) ) {
					// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
					file_put_contents( $dir . '/.htaccess', "Require all denied\n" );
				}
				if ( ! file_exists( $dir . '/index.html' ) ) {
					// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
					file_put_contents( $dir . '/index.html', '' );
				}
				$safe = 'order-' . $order_id . '-' . wp_generate_password( 8, false, false ) . '.' . strtolower( $ext );
				$dest = trailingslashit( $dir ) . $safe;
				if ( @move_uploaded_file( $file['tmp_name'], $dest ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
					$order->update_meta_data( '_mgw_ffl_ffl_file_path', $dest );
				} else {
					$order->add_order_note( 'FFL file upload failed: could not move uploaded file.' );
				}
			}
		}
	}

	if ( mgw_ffl_has_firearms_group( $slugs ) ) {
		$order->update_meta_data( '_mgw_ffl_requires_verification', '1' );
	}

	$order->save();
}
add_action( 'woocommerce_checkout_order_processed', 'mgw_ffl_save_order_meta', 20, 3 );

/**
 * After gateways adjust status, keep firearm orders on hold for manual FFL verification.
 *
 * @param int      $order_id Order ID.
 * @param string   $from     Previous status.
 * @param string   $to       New status.
 * @param WC_Order $order    Order object.
 */
function mgw_ffl_force_on_hold_for_ffl( $order_id, $from, $to, $order ) {
	unset( $from );
	static $busy = false;
	if ( $busy ) {
		return;
	}
	if ( ! $order instanceof WC_Order ) {
		return;
	}
	if ( '1' !== $order->get_meta( '_mgw_ffl_requires_verification', true ) ) {
		return;
	}
	if ( ! in_array( $to, array( 'pending', 'processing' ), true ) ) {
		return;
	}
	$busy = true;
	$order->update_status(
		'on-hold',
		__( 'Firearm order held for FFL verification (MGW).', 'mgw-ffl' )
	);
	$busy = false;
}
add_action( 'woocommerce_order_status_changed', 'mgw_ffl_force_on_hold_for_ffl', 25, 4 );
