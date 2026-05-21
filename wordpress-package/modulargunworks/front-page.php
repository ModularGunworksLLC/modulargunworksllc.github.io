<?php get_header(); ?>

<main>
  <section class="hero-section">
    <h1>Huntsville FFL Gun Shop · Transfers · Local pickup</h1>
    <p>Modular Gunworks is a veteran-owned licensed FFL serving North Alabama—professional transfers, gunsmithing, and a deep online catalog shipped fast from right here.</p>
    <p class="hero-local-meta"><a href="tel:+12563843852">(256) 384-3852</a> · Huntsville · M-F 9–6 · Sat 10–4 CT</p>
    <div class="hero-cta-buttons">
      <?php
      $shop_url = function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop');
      $ammo_url = (function_exists('get_term_by') && taxonomy_exists('product_cat')) ? (get_term_by('slug', 'ammunition', 'product_cat') ? get_term_link(get_term_by('slug', 'ammunition', 'product_cat')) : $shop_url . '?product_cat=ammunition') : $shop_url;
      if (is_wp_error($ammo_url)) {
        $ammo_url = $shop_url;
      }
      ?>
      <a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>" class="hero-cta-btn primary"><?php esc_html_e('FFL transfers', 'modulargunworks'); ?></a>
      <a href="<?php echo esc_url(home_url('/services')); ?>" class="hero-cta-btn secondary"><?php esc_html_e('Services & gunsmithing', 'modulargunworks'); ?></a>
      <a href="<?php echo esc_url($shop_url); ?>" class="hero-cta-btn secondary"><?php esc_html_e('Shop online catalog', 'modulargunworks'); ?></a>
    </div>
  </section>

  <section class="carousel-section">
    <h2 class="section-title">Shop by Category</h2>
    <div class="carousel-container">
      <div class="carousel" id="featured-carousel">
        <?php
        $categories = [
          ['slug' => 'ammunition', 'name' => 'Ammunition', 'count' => 'Large selection', 'img' => 'ammunition.jpg'],
          ['slug' => 'magazines', 'name' => 'Magazines', 'count' => 'Pistol · rifle · more', 'img' => 'magazines.jpg'],
          ['slug' => 'firearms', 'name' => 'Firearms', 'count' => 'Handguns, rifles & shotguns', 'img' => 'gear.jpg'],
          ['slug' => 'gun-parts', 'name' => 'Gun Parts', 'count' => 'Repair & upgrades', 'img' => 'gun-parts.jpg'],
          ['slug' => 'gear', 'name' => 'Tactical Gear', 'count' => 'Range & duty', 'img' => 'gear.jpg'],
          ['slug' => 'optics', 'name' => 'Optics & Sights', 'count' => 'Red dots · scopes', 'img' => 'optics.jpg'],
          ['slug' => 'reloading', 'name' => 'Reloading', 'count' => 'Components · tools', 'img' => 'reloading.jpg'],
          ['slug' => 'outdoors', 'name' => 'Outdoors', 'count' => 'Field & hunt', 'img' => 'outdoors.jpg'],
          ['slug' => 'brands', 'name' => 'Shop by Brand', 'count' => 'Top manufacturers', 'img' => 'brands.jpg'],
        ];
        $shop_url_inner = function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop');
        $brands_page = get_page_by_path('brands');
        foreach ($categories as $cat) :
          if ($cat['slug'] === 'brands') {
            $url = ($brands_page ? get_permalink($brands_page) : home_url('/brands/'));
          } else {
            $term = function_exists('get_term_by') && taxonomy_exists('product_cat') ? get_term_by('slug', $cat['slug'], 'product_cat') : null;
            $url = $term && !is_wp_error(get_term_link($term)) ? get_term_link($term) : ($shop_url_inner . '?product_cat=' . $cat['slug']);
          }
          $img_path = get_template_directory_uri() . '/assets/images/categories/' . $cat['img'];
        ?>
        <div class="carousel-item">
          <a href="<?php echo esc_url($url); ?>" class="category-card">
            <img src="<?php echo esc_url($img_path); ?>" alt="<?php echo esc_attr($cat['name']); ?>" width="280" height="150" loading="lazy" decoding="async">
            <h3><?php echo esc_html($cat['name']); ?></h3>
            <p><?php echo esc_html($cat['count']); ?></p>
          </a>
        </div>
        <?php endforeach; ?>
      </div>
      <div class="carousel-controls">
        <button type="button" class="carousel-btn" onclick="scrollCarousel(-1)" aria-label="<?php esc_attr_e('Previous categories', 'modulargunworks'); ?>">❮</button>
        <button type="button" class="carousel-btn" onclick="scrollCarousel(1)" aria-label="<?php esc_attr_e('Next categories', 'modulargunworks'); ?>">❯</button>
      </div>
    </div>
  </section>

  <section class="why-shop-section">
    <h2>Why Huntsville Shops Here</h2>
    <div class="why-shop-grid">
      <div class="why-shop-item">
        <i class="fas fa-medal"></i>
        <h3>Veteran-owned</h3>
        <p>Integrity-first service—we treat transfers and local pickups with the same care as outbound orders.</p>
      </div>
      <div class="why-shop-item">
        <i class="fas fa-store"></i>
        <h3>Licensed FFL + services</h3>
        <p>Transfers at our Huntsville desk, gunsmithing, and help navigating compliant shipping—all in one place.</p>
      </div>
      <div class="why-shop-item">
        <i class="fas fa-truck"></i>
        <h3>Deep catalog · fast fulfillment</h3>
        <p>Same-day or next-business-day processing whenever possible—we ship compliant orders nationwide.</p>
      </div>
      <div class="why-shop-item">
        <i class="fas fa-check-circle"></i>
        <h3>Trusted brands</h3>
        <p>Major manufacturers alongside hard-to-find parts—curated alongside our local counter service.</p>
      </div>
    </div>
  </section>

  <section class="about-section">
    <h2>About Modular Gunworks</h2>
    <p>Huntsville Alabama’s Modular Gunworks is a veteran-owned gun shop and FFL—we welcome online buyers needing a receiving dealer, Alabama residents picking up transfers, and customers who shop our full ecommerce catalog.</p>
    <p>Fair pricing, honest timelines, and clear communication. Whether you need ammo shipped to your door, gear for the range, or a smooth FFL transfer, we are built to serve North Alabama first.</p>
    <a href="<?php echo esc_url(home_url('/about')); ?>" class="about-cta-link">Learn more about us →</a>
  </section>
</main>

<script>
function scrollCarousel(direction) {
  const carousel = document.getElementById('featured-carousel');
  if (carousel) carousel.scrollLeft += direction * 320;
}
</script>

<?php get_footer(); ?>
