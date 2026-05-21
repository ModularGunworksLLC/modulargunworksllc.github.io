<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#181a1b">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header id="site-header">
  <div class="header-top-row">
    <p class="header-site-title">MODULAR GUNWORKS LLC</p>
    <a href="<?php echo esc_url(home_url('/')); ?>" class="header-logo" title="Home">
      <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/modular-gunworks-llc.png'); ?>" alt="Modular Gunworks Logo">
      <span class="logo-label">HOME</span>
    </a>
  </div>

  <div class="header-middle-row">
    <div class="header-middle-row-inner">
      <div class="header-left-links">
        <a href="<?php echo esc_url(home_url('/my-account')); ?>">Account</a>
        <a href="<?php echo esc_url(home_url('/help')); ?>">Help</a>
        <?php if (function_exists('wc_get_cart_url')) : ?>
        <a href="<?php echo esc_url(wc_get_cart_url()); ?>"><i class="fas fa-shopping-cart"></i> Cart <span class="cart-count-badge" style="background: var(--color-primary); color: #fff; padding: 2px 6px; border-radius: 10px; font-size: 0.75rem;"><?php echo function_exists('WC') && WC()->cart ? absint(WC()->cart->get_cart_contents_count()) : 0; ?></span></a>
        <?php else : ?>
        <a href="<?php echo esc_url(home_url('/cart')); ?>"><i class="fas fa-shopping-cart"></i> Cart</a>
        <?php endif; ?>
      </div>

      <form class="search-bar" action="<?php echo esc_url(function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop')); ?>" method="get" role="search" aria-label="<?php esc_attr_e('Search products', 'modulargunworks'); ?>">
        <input type="text" name="s" placeholder="<?php esc_attr_e('Search products, ammo, optics… (pickup & ship from Huntsville)', 'modulargunworks'); ?>">
        <input type="hidden" name="post_type" value="product">
        <button type="submit"><?php esc_html_e('Search', 'modulargunworks'); ?></button>
      </form>
    </div>
    <div class="header-local-strip">
      <p class="header-local-tagline"><?php esc_html_e('Licensed FFL · Transfers & local pickup · Huntsville, Alabama', 'modulargunworks'); ?></p>
      <nav class="header-local-links" aria-label="<?php esc_attr_e('Quick local links', 'modulargunworks'); ?>">
        <a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>"><?php esc_html_e('FFL transfers', 'modulargunworks'); ?></a>
        <a href="<?php echo esc_url(home_url('/services')); ?>"><?php esc_html_e('Services', 'modulargunworks'); ?></a>
        <a href="<?php echo esc_url(home_url('/contact')); ?>"><?php esc_html_e('Contact & hours', 'modulargunworks'); ?></a>
      </nav>
    </div>
  </div>

  <nav class="category-nav">
    <?php
    $shop_url = function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop');
    $cat_slugs = ['ammunition', 'magazines', 'firearms', 'gun-parts', 'gear', 'optics', 'reloading', 'outdoors', 'brands'];
    $cat_names = ['Ammunition', 'Magazines', 'Firearms', 'Gun Parts', 'Gear', 'Optics', 'Reloading', 'Outdoors', 'Brands'];
    $brands_page = get_page_by_path('brands');
    if (function_exists('get_term_by') && taxonomy_exists('product_cat')) {
      foreach ($cat_slugs as $i => $slug) {
        if ($slug === 'brands') {
          $url = ($brands_page ? get_permalink($brands_page) : home_url('/brands/'));
        } else {
          $term = get_term_by('slug', $slug, 'product_cat');
          $url = $term ? get_term_link($term) : $shop_url . '?product_cat=' . $slug;
          $url = is_wp_error($url) ? $shop_url . '?product_cat=' . $slug : $url;
        }
        echo '<a href="' . esc_url($url) . '">' . esc_html($cat_names[$i]) . '</a>';
      }
    } else {
      foreach ($cat_slugs as $i => $slug) {
        if ($slug === 'brands') {
          $url = ($brands_page ? get_permalink($brands_page) : home_url('/brands/'));
        } else {
          $url = $shop_url . '?product_cat=' . $slug;
        }
        echo '<a href="' . esc_url($url) . '">' . esc_html($cat_names[$i]) . '</a>';
      }
    }
    ?>
    <a href="<?php echo esc_url(home_url('/services')); ?>">Services</a>
  </nav>

  <div class="promo-bar">
    ⭐ Veteran Owned • Huntsville, AL • Professional Service
  </div>
</header>
