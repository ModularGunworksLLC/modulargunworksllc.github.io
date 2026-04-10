<?php
/**
 * WooCommerce template root: chrome + default Woo templates (no heavy theme overrides).
 */
defined( 'ABSPATH' ) || exit;

get_header( 'shop' );
?>

<div class="mgw-shell-woo-wrap">
  <?php woocommerce_content(); ?>
</div>

<?php
get_footer( 'shop' );
