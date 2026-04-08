<?php
/**
 * Shop & Category Archive - Modular Gunworks
 * Retail-style layout: sidebar filters + product grid (Ammo Depot style)
 */
defined('ABSPATH') || exit;

get_header('shop');

$current_cat = is_product_category() ? get_queried_object() : null;
$current_brand = is_tax('pa_brand') ? get_queried_object() : null;
$page_title = $current_cat ? $current_cat->name : ($current_brand ? $current_brand->name : __('Shop', 'modulargunworks'));
$page_desc = $current_cat && $current_cat->description ? $current_cat->description : ($current_brand && $current_brand->description ? $current_brand->description : __('Quality firearms, ammunition, and gear at competitive prices.', 'modulargunworks'));
?>

<div class="mgw-shop-wrapper">
  <header class="mgw-shop-page-header">
    <h1 class="mgw-shop-page-title"><?php echo esc_html($page_title); ?></h1>
    <?php if ($page_desc) : ?>
    <p class="mgw-shop-page-desc"><?php echo esc_html($page_desc); ?></p>
    <?php endif; ?>
  </header>

  <main class="mgw-shop-main ammunition-main">
    <?php
    $filter_template = get_template_directory() . '/woocommerce/sidebar-shop-filters.php';
    if (file_exists($filter_template)) {
      include $filter_template;
    }
    ?>

    <div class="ammunition-content mgw-shop-content">

    <?php
    $ffl_page = get_page_by_path('firearm-transfer-guide');
    $ffl_guide_url = $ffl_page ? get_permalink($ffl_page) : home_url('/firearm-transfer-guide/');
    $cat_slug = $current_cat ? strtolower($current_cat->slug) : '';
    if (in_array($cat_slug, ['firearms', 'guns'])) : ?>
    <div class="mgw-ffl-notice mgw-ffl-notice-category">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong><?php esc_html_e('FFL Required for Firearms', 'modulargunworks'); ?></strong>
        <?php printf(
          wp_kses(__('All firearms must be shipped to a licensed FFL dealer. We cannot ship to residential addresses or P.O. boxes. You must complete the transfer and background check at your chosen FFL. <a href="%s" target="_blank" rel="noopener">Firearm Transfer Guide</a>', 'modulargunworks'), ['a' => ['href' => [], 'target' => [], 'rel' => []]]),
          esc_url($ffl_guide_url)
        ); ?>
      </div>
    </div>
    <?php endif; ?>

    <?php if (woocommerce_product_loop()) : ?>

      <div id="mgw-ajax-products-wrap">

      <?php woocommerce_output_all_notices(); ?>

      <?php
      $search_form_action = $current_cat ? get_term_link($current_cat) : ($current_brand ? get_term_link($current_brand) : (function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop')));
      $search_form_action = is_wp_error($search_form_action) ? home_url('/shop') : $search_form_action;
      ?>
      <div class="product-controls mgw-product-controls">
        <form class="mgw-product-search-form" action="<?php echo esc_url($search_form_action); ?>" method="get">
          <?php /* Only add post_type on main shop - prevents category pages (e.g. Magazines) from going blank */ ?>
          <?php if (!$current_cat && !$current_brand) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
          <?php
          $preserve = ['filter_stock', 'min_price', 'max_price', 'filter_pa_brand', 'filter_pa_caliber', 'filter_pa_bullet_type', 'filter_pa_grain_weight', 'filter_pa_capacity', 'orderby', 'per_page'];
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
        <?php
        $per_page = isset($_GET['per_page']) ? absint($_GET['per_page']) : 0;
        $per_page_options = [24 => 24, 48 => 48, 96 => 96];
        $current_per_page = in_array($per_page, $per_page_options) ? $per_page : (int) get_option('posts_per_page', 16);
        if (!in_array($current_per_page, $per_page_options)) $current_per_page = 24;
        $per_page_base = $current_cat ? get_term_link($current_cat) : ($current_brand ? get_term_link($current_brand) : (function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop')));
        $per_page_base = is_wp_error($per_page_base) ? home_url('/shop') : $per_page_base;
        $keep_keys = ['filter_stock', 'min_price', 'max_price', 'filter_pa_brand', 'filter_pa_caliber', 'filter_pa_bullet_type', 'filter_pa_grain_weight', 'filter_pa_capacity', 'orderby', 's', 'brand', 'caliber', 'capacity', 'bullet-type', 'grain', 'price', 'in-stock', 'firearm-type', 'on-sale'];
        $preserve_params = [];
        foreach ($keep_keys as $k) {
            if (isset($_GET[$k]) && $_GET[$k] !== '') {
                $preserve_params[$k] = is_array($_GET[$k]) ? implode(',', array_map('sanitize_text_field', array_map('wp_unslash', $_GET[$k]))) : sanitize_text_field(wp_unslash($_GET[$k]));
            }
        }
        $per_page_base = add_query_arg($preserve_params, $per_page_base);
        ?>
        <div class="mgw-results-per-page">
          <span class="mgw-per-page-label"><?php esc_html_e('Show', 'modulargunworks'); ?></span>
          <?php foreach ($per_page_options as $val) : ?>
          <a href="<?php echo esc_url(add_query_arg('per_page', $val, $per_page_base)); ?>" class="mgw-per-page-link <?php echo $val === $current_per_page ? 'current' : ''; ?>"><?php echo (int) $val; ?></a>
          <?php endforeach; ?>
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
</div>

<?php get_footer('shop'); ?>
