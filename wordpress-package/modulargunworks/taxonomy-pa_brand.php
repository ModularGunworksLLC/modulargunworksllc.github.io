<?php
/**
 * Brand Archive - Products for a single brand (e.g. /product-brand/hornady/)
 * Uses shop layout with filters + "Back to All Brands" link
 */
defined('ABSPATH') || exit;

$brand = get_queried_object();
$brands_page = get_page_by_path('brands');
$brands_url = $brands_page ? get_permalink($brands_page) : home_url('/brands/');

get_header('shop');
?>
<main class="mgw-shop-main ammunition-main">
  <?php
  $filter_template = get_template_directory() . '/woocommerce/sidebar-shop-filters.php';
  if (file_exists($filter_template)) {
    include $filter_template;
  }
  ?>

  <div class="ammunition-content mgw-shop-content">
    <p class="mgw-back-link">
      <a href="<?php echo esc_url($brands_url); ?>"><?php esc_html_e('← Back to All Brands', 'modulargunworks'); ?></a>
    </p>
    <h1 class="page-title"><?php echo esc_html($brand ? $brand->name : __('Brand', 'modulargunworks')); ?></h1>

    <?php if (woocommerce_product_loop()) : ?>

      <div id="mgw-ajax-products-wrap">

      <?php woocommerce_output_all_notices(); ?>

      <?php
      $brand_term_link = $brand ? get_term_link($brand) : home_url('/shop');
      $brand_term_link = is_wp_error($brand_term_link) ? home_url('/shop') : $brand_term_link;
      ?>
      <div class="product-controls mgw-product-controls">
        <form class="mgw-product-search-form" action="<?php echo esc_url($brand_term_link); ?>" method="get">
          <input type="hidden" name="post_type" value="product">
          <?php
          $preserve = ['filter_stock', 'min_price', 'max_price', 'filter_pa_brand', 'filter_pa_caliber', 'filter_pa_bullet_type', 'filter_pa_grain_weight', 'filter_pa_capacity', 'orderby'];
          foreach ($preserve as $key) :
            if (!empty($_GET[$key])) :
              $val = is_array($_GET[$key]) ? implode(',', array_map('sanitize_text_field', $_GET[$key])) : sanitize_text_field($_GET[$key]);
          ?><input type="hidden" name="<?php echo esc_attr($key); ?>" value="<?php echo esc_attr($val); ?>"><?php
            endif;
          endforeach;
          ?>
          <input type="search" name="s" value="<?php echo esc_attr(isset($_GET['s']) ? sanitize_text_field(wp_unslash($_GET['s'])) : ''); ?>" placeholder="<?php esc_attr_e('Search by name, brand, SKU', 'modulargunworks'); ?>" class="mgw-product-search-input">
        </form>
        <div class="product-count">
          <?php woocommerce_result_count(); ?>
        </div>
        <div class="mgw-ordering">
          <?php woocommerce_catalog_ordering(); ?>
        </div>
      </div>

      <?php woocommerce_product_loop_start(); ?>
      <?php
      while (have_posts()) {
        the_post();
        wc_get_template_part('content', 'product');
      }
      ?>
      <?php woocommerce_product_loop_end(); ?>

      <?php woocommerce_pagination(); ?>

      </div><!-- #mgw-ajax-products-wrap -->

    <?php else : ?>

      <div id="mgw-ajax-products-wrap">
      <?php do_action('woocommerce_no_products_found'); ?>
      </div>

    <?php endif; ?>
  </div>
</main>
<?php get_footer('shop'); ?>
