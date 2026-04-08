<?php
/**
 * Template: Blog - displays latest posts
 */
get_header();
?>
<main>
  <h1 class="page-title">Blog</h1>
  <?php if (have_posts()) : ?>
  <div class="blog-posts">
    <?php while (have_posts()) : the_post(); ?>
    <article class="blog-post">
      <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
      <p class="post-meta"><?php echo get_the_date(); ?></p>
      <?php the_excerpt(); ?>
      <a href="<?php the_permalink(); ?>" class="read-more">Read more →</a>
    </article>
    <?php endwhile; ?>
  </div>
  <?php the_posts_pagination(); ?>
  <?php else : ?>
  <p>No posts yet. Check back soon!</p>
  <?php endif; ?>
</main>
<style>
.blog-post{margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid #e0e0e0;}
.blog-post h2{margin-bottom:.5rem;}.blog-post .post-meta{color:#666;font-size:.9rem;margin-bottom:1rem;}
.read-more{color:var(--color-primary);font-weight:600;}
</style>
<?php get_footer(); ?>
