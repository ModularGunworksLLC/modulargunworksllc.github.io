<?php
/**
 * Brand taxonomy archive fallback.
 *
 * Use the same normalized archive flow as other WooCommerce product archives.
 */
defined( 'ABSPATH' ) || exit;

wc_get_template( 'archive-product.php' );
