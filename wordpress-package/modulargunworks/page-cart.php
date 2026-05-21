<?php
/**
 * Cart page template.
 *
 * Normalized approach: WooCommerce shortcode content is managed in the Cart page
 * body in wp-admin. This template only provides the visual shell.
 */
defined( 'ABSPATH' ) || exit;

get_header();
?>
<main class="mgw-cart-page" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : ?>
			<?php the_post(); ?>
			<h1 class="page-title"><?php the_title(); ?></h1>
			<?php the_content(); ?>
		<?php endwhile; ?>
	<?php endif; ?>
</main>
<?php get_footer(); ?>
