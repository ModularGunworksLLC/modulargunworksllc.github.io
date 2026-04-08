<?php
/**
 * Template Name: Shop By Brand
 * Description: Grid of brand tiles linking to each brand's product listing (uses pa_brand + media images)
 */
defined('ABSPATH') || exit;

get_header('shop');

$brand_terms = [];
if (taxonomy_exists('pa_brand')) {
    $terms = get_terms([
        'taxonomy' => 'pa_brand',
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC',
    ]);
    if (!is_wp_error($terms)) {
        $brand_terms = $terms;
    }
}
?>
<main class="mgw-brands-main">
  <h1 class="page-title"><?php esc_html_e('Shop by Brand', 'modulargunworks'); ?></h1>
  <p class="brands-subtitle"><?php esc_html_e('Browse our manufacturers. Click any brand to see all their products.', 'modulargunworks'); ?></p>

  <?php if (empty($brand_terms)) : ?>
  <p class="no-brands"><?php esc_html_e('No brands available yet. Add the Brand attribute to products and assign brand images in Products → Attributes → Brand.', 'modulargunworks'); ?></p>
  <?php else : ?>
  <div class="brands-grid">
    <?php foreach ($brand_terms as $term) :
        $brand_url = get_term_link($term);
        if (is_wp_error($brand_url)) continue;
        $thumb_id = get_term_meta($term->term_id, 'thumbnail_id', true);
        $img_url = $thumb_id ? wp_get_attachment_image_url($thumb_id, 'medium') : '';
    ?>
    <a href="<?php echo esc_url($brand_url); ?>" class="brand-card">
      <div class="brand-logo">
        <?php if ($img_url) : ?>
        <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr($term->name); ?>">
        <?php else : ?>
        <span class="brand-logo-placeholder"><?php echo esc_html(substr($term->name, 0, 1)); ?></span>
        <?php endif; ?>
      </div>
      <h3><?php echo esc_html($term->name); ?></h3>
      <p><?php printf(esc_html(_n('%d product', '%d products', $term->count, 'modulargunworks')), (int) $term->count); ?></p>
    </a>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</main>
<?php get_footer('shop'); ?>
