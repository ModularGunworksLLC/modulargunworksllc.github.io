<?php
/**
 * WooCommerce sidebar → theme shop-sidebar widget area (native WC widgets / Layered Nav / Price filter).
 *
 * @package WooCommerce\Templates
 */
defined( 'ABSPATH' ) || exit;

$clear_filters_url = '';
if ( function_exists( 'is_shop' ) && ( is_shop() || is_product_category() || is_tax( 'pa_brand' ) ) ) {
	$current_url = '';
	if ( is_product_category() || is_tax( 'pa_brand' ) ) {
		$obj = get_queried_object();
		if ( $obj ) {
			$current_url = get_term_link( $obj );
			if ( is_wp_error( $current_url ) ) {
				$current_url = '';
			}
		}
	}
	if ( '' === $current_url ) {
		$current_url = get_permalink( wc_get_page_id( 'shop' ) );
	}
	if ( is_string( $current_url ) && '' !== $current_url ) {
		$clear_filters_url = remove_query_arg( array_keys( $_GET ), $current_url );
	}
}
if ( '' === $clear_filters_url ) {
	$clear_filters_url = get_permalink( wc_get_page_id( 'shop' ) );
}

global $wp_query;
$mgw_no_results = ( is_shop() || is_product_taxonomy() ) && $wp_query && (int) $wp_query->found_posts === 0;
?>
<aside id="secondary" class="widget-area mgw-shop-sidebar mgw-woo-sidebar" role="complementary">
	<?php if ( $mgw_no_results ) : ?>
		<p class="mgw-catalog-empty-sidebar-msg"><?php esc_html_e( 'Filters will appear here once products are available in this view.', 'modulargunworks' ); ?></p>
	<?php else : ?>
	<div class="filter-header">
		<h3><?php esc_html_e( 'Filters', 'modulargunworks' ); ?></h3>
		<a href="<?php echo esc_url( $clear_filters_url ); ?>" class="clear-filters-link clear-filters-red">
			<?php esc_html_e( 'Clear All', 'modulargunworks' ); ?>
		</a>
	</div>
	<div class="mgw-filter-scroll-wrapper">
		<?php wc_get_template( 'sidebar-shop-filters.php' ); ?>
		<?php if ( 'widgets' === modulargunworks_get_filter_surface_mode() && is_active_sidebar( 'shop-sidebar' ) ) : ?>
			<?php dynamic_sidebar( 'shop-sidebar' ); ?>
		<?php endif; ?>
	</div>
	<?php endif; ?>
</aside>
