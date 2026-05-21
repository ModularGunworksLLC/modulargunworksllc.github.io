<?php
/**
 * Plugin Name: MGW Checkout Trace
 * Description: Temporary diagnostics for classic checkout. Remove after debugging.
 * Version: 1.0.0
 */
defined( 'ABSPATH' ) || exit;

/**
 * @param string $msg
 * @param array<string,mixed> $ctx
 */
function mgw_checkout_trace_log( $msg, array $ctx = array() ) {
	if ( ! function_exists( 'wc_get_logger' ) ) {
		return;
	}
	$ctx['source'] = 'mgw-checkout-trace';
	wc_get_logger()->info( $msg, $ctx );
}

add_action(
	'woocommerce_checkout_process',
	static function () {
		mgw_checkout_trace_log(
			'checkout_process reached',
			array(
				'ajax'   => wp_doing_ajax() ? 'yes' : 'no',
				'ip'     => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( (string) $_SERVER['REMOTE_ADDR'] ) ) : '',
				'method' => isset( $_POST['payment_method'] ) ? sanitize_key( (string) wp_unslash( $_POST['payment_method'] ) ) : '', // phpcs:ignore WordPress.Security.NonceVerification.Missing
			)
		);
	},
	999
);

add_action(
	'woocommerce_after_checkout_validation',
	static function ( $data, $errors ) {
		$codes = array();
		if ( $errors instanceof WP_Error && ! empty( $errors->errors ) ) {
			$codes = array_keys( $errors->errors );
		}
		mgw_checkout_trace_log(
			'after_checkout_validation',
			array(
				'error_count' => is_array( $codes ) ? count( $codes ) : 0,
				'error_codes' => implode( ',', array_slice( $codes, 0, 20 ) ),
			)
		);
	},
	9999,
	2
);
