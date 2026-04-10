<?php
get_header();
?>

<main class="mgw-shell-page">
  <?php
  while ( have_posts() ) :
    the_post();
    ?>
    <article <?php post_class(); ?>>
      <h1 class="mgw-shell-page-title"><?php the_title(); ?></h1>
      <div class="mgw-shell-page-content">
        <?php the_content(); ?>
      </div>
    </article>
  <?php endwhile; ?>
</main>

<?php
get_footer();
