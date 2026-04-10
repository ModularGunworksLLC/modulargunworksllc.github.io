<?php
/**
 * WooCommerce product archives.
 *
 * Keeps the MGW visual shell while delegating filtering/querying to WooCommerce widgets/plugins.
 */
defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

$current_cat   = is_product_category() ? get_queried_object() : null;
$current_brand = is_tax( 'pa_brand' ) ? get_queried_object() : null;
$page_title    = $current_cat ? $current_cat->name : ( $current_brand ? $current_brand->name : __( 'Shop', 'modulargunworks' ) );
$page_desc     = $current_cat && $current_cat->description
	? $current_cat->description
	: ( $current_brand && $current_brand->description ? $current_brand->description : __( 'Quality firearms, ammunition, and gear at competitive prices.', 'modulargunworks' ) );
?>

<div class="mgw-shop-wrapper">
	<header class="mgw-shop-page-header">
		<h1 class="mgw-shop-page-title"><?php echo esc_html( $page_title ); ?></h1>
		<?php if ( $page_desc ) : ?>
			<p class="mgw-shop-page-desc"><?php echo esc_html( $page_desc ); ?></p>
		<?php endif; ?>
	</header>

	<main class="mgw-shop-main ammunition-main">
		<?php do_action( 'woocommerce_sidebar' ); ?>

		<div class="ammunition-content mgw-shop-content">
			<?php
			$ffl_page      = get_page_by_path( 'firearm-transfer-guide' );
			$ffl_guide_url = $ffl_page ? get_permalink( $ffl_page ) : home_url( '/firearm-transfer-guide/' );
			$cat_slug      = $current_cat ? strtolower( $current_cat->slug ) : '';

			if ( in_array( $cat_slug, array( 'firearms', 'guns' ), true ) ) :
				?>
				<div class="mgw-ffl-notice mgw-ffl-notice-category">
					<i class="fas fa-info-circle"></i>
					<div>
						<strong><?php esc_html_e( 'FFL Required for Firearms', 'modulargunworks' ); ?></strong>
						<?php
						printf(
							wp_kses(
								__( 'All firearms must be shipped to a licensed FFL dealer. We cannot ship to residential addresses or P.O. boxes. You must complete the transfer and background check at your chosen FFL. <a href="%s" target="_blank" rel="noopener">Firearm Transfer Guide</a>', 'modulargunworks' ),
								array(
									'a' => array(
										'href'   => array(),
										'target' => array(),
										'rel'    => array(),
									),
								)
							),
							esc_url( $ffl_guide_url )
						);
						?>
					</div>
				</div>
			<?php endif; ?>

			<?php do_action( 'woocommerce_before_shop_loop' ); ?>

			<?php if ( woocommerce_product_loop() ) : ?>
				<?php woocommerce_product_loop_start(); ?>
				<?php while ( have_posts() ) : ?>
					<?php the_post(); ?>
					<?php wc_get_template_part( 'content', 'product' ); ?>
				<?php endwhile; ?>
				<?php woocommerce_product_loop_end(); ?>

				<?php do_action( 'woocommerce_after_shop_loop' ); ?>
			<?php else : ?>
				<?php do_action( 'woocommerce_no_products_found' ); ?>
			<?php endif; ?>
		</div>
	</main>
</div>

<?php get_footer( 'shop' ); ?>
