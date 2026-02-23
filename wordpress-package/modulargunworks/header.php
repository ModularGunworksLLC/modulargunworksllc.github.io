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
    <h1>MODULAR GUNWORKS LLC</h1>
    <a href="<?php echo esc_url(home_url('/')); ?>" class="header-logo" title="Home">
      <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/modular-gunworks-llc.png'); ?>" alt="Modular Gunworks Logo">
      <span class="logo-label">HOME</span>
    </a>
  </div>

  <div class="header-middle-row">
    <div class="header-left-links">
      <a href="<?php echo esc_url(home_url('/order-status')); ?>">Account</a>
      <a href="<?php echo esc_url(home_url('/help')); ?>">Help</a>
      <a href="<?php echo esc_url(wc_get_cart_url()); ?>"><i class="fas fa-shopping-cart"></i> Cart <span class="cart-count-badge" style="background: var(--color-primary); color: #fff; padding: 2px 6px; border-radius: 10px; font-size: 0.75rem; display: none;">0</span></a>
    </div>

    <form class="search-bar" action="<?php echo esc_url(home_url('/shop')); ?>" method="get">
      <input type="text" name="s" placeholder="Search ammo, gear, optics...">
      <button type="submit">Search</button>
    </form>
  </div>

  <nav class="category-nav">
    <?php if (function_exists('wc_get_page_permalink')) : ?>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=ammunition'); ?>">Ammunition</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=magazines'); ?>">Magazines</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=firearms'); ?>">Firearms</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=gun-parts'); ?>">Gun Parts</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=gear'); ?>">Gear</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=optics'); ?>">Optics</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=reloading'); ?>">Reloading</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=outdoors'); ?>">Outdoors</a>
    <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=brands'); ?>">Brands</a>
    <?php else : ?>
    <a href="<?php echo esc_url(home_url('/shop')); ?>">Shop</a>
    <?php endif; ?>
    <a href="<?php echo esc_url(home_url('/services')); ?>">Services</a>
  </nav>

  <div class="promo-bar">
    Free shipping on orders over $99 | ⭐ Veteran Owned • Huntsville, AL • Professional Service
  </div>
</header>
