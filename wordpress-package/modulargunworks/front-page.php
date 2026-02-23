<?php get_header(); ?>

<main>
  <section class="hero-section">
    <h2>Lower Prices. Same Quality. Huntsville-Based.</h2>
    <p>Why pay national prices when we ship fast from Alabama? Quality firearms, ammunition, and gear at prices you'll love.</p>
    <div class="hero-cta-buttons">
      <?php if (function_exists('wc_get_page_permalink')) : ?>
      <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=ammunition'); ?>" class="hero-cta-btn primary">Shop Ammunition</a>
      <a href="<?php echo esc_url(get_permalink(wc_get_page_id('shop')) . '?product_cat=gear'); ?>" class="hero-cta-btn secondary">Browse Gear & Parts</a>
      <?php else : ?>
      <a href="<?php echo esc_url(home_url('/shop')); ?>" class="hero-cta-btn primary">Shop Ammunition</a>
      <a href="<?php echo esc_url(home_url('/shop')); ?>" class="hero-cta-btn secondary">Browse Gear & Parts</a>
      <?php endif; ?>
    </div>
  </section>

  <section class="carousel-section">
    <h2 class="section-title">Shop by Category</h2>
    <div class="carousel-container">
      <div class="carousel" id="featured-carousel">
        <?php
        $categories = [
          ['slug' => 'ammunition', 'name' => 'Ammunition', 'count' => '7,446+ Items', 'img' => 'ammunition.jpg'],
          ['slug' => 'magazines', 'name' => 'Magazines', 'count' => '1,200+ Items', 'img' => 'magazines.jpg'],
          ['slug' => 'firearms', 'name' => 'Firearms', 'count' => 'Handguns, Rifles & Shotguns', 'img' => 'gear.jpg'],
          ['slug' => 'gun-parts', 'name' => 'Gun Parts', 'count' => '2,300+ Items', 'img' => 'gun-parts.jpg'],
          ['slug' => 'gear', 'name' => 'Tactical Gear', 'count' => '1,800+ Items', 'img' => 'gear.jpg'],
          ['slug' => 'optics', 'name' => 'Optics & Sights', 'count' => '2,100+ Items', 'img' => 'optics.jpg'],
          ['slug' => 'reloading', 'name' => 'Reloading', 'count' => '950+ Items', 'img' => 'reloading.jpg'],
          ['slug' => 'outdoors', 'name' => 'Outdoors', 'count' => '1,200+ Items', 'img' => 'outdoors.jpg'],
          ['slug' => 'brands', 'name' => 'Shop by Brand', 'count' => '80+ Brands', 'img' => 'brands.jpg'],
        ];
        $shop_url = function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop');
        foreach ($categories as $cat) :
          $url = $shop_url . '?product_cat=' . $cat['slug'];
          $img_path = get_template_directory_uri() . '/assets/images/categories/' . $cat['img'];
        ?>
        <div class="carousel-item">
          <a href="<?php echo esc_url($url); ?>" class="category-card">
            <img src="<?php echo esc_url($img_path); ?>" alt="<?php echo esc_attr($cat['name']); ?>">
            <h3><?php echo esc_html($cat['name']); ?></h3>
            <p><?php echo esc_html($cat['count']); ?></p>
          </a>
        </div>
        <?php endforeach; ?>
      </div>
      <div class="carousel-controls">
        <button class="carousel-btn" onclick="scrollCarousel(-1)">❮</button>
        <button class="carousel-btn" onclick="scrollCarousel(1)">❯</button>
      </div>
    </div>
  </section>

  <section class="why-shop-section">
    <h2>Why Shop With Us</h2>
    <div class="why-shop-grid">
      <div class="why-shop-item">
        <i class="fas fa-medal"></i>
        <h3>Veteran-Owned</h3>
        <p>Built on integrity, service, and respect. A business by veterans, for everyone.</p>
      </div>
      <div class="why-shop-item">
        <i class="fas fa-dollar-sign"></i>
        <h3>Competitive Pricing</h3>
        <p>Quality gear at fair prices. We undercut the market so you save money.</p>
      </div>
      <div class="why-shop-item">
        <i class="fas fa-truck"></i>
        <h3>Fast Shipping</h3>
        <p>Based in Huntsville, AL. Quick processing and reliable delivery.</p>
      </div>
      <div class="why-shop-item">
        <i class="fas fa-check-circle"></i>
        <h3>Quality Selection</h3>
        <p>Trusted brands and products you can rely on. 17,000+ items in stock.</p>
      </div>
    </div>
  </section>

  <section class="about-section">
    <h2>About Modular Gunworks</h2>
    <p>Veteran-owned gun shop in Huntsville serving customers locally and nationwide. We believe in providing quality products at competitive prices with straightforward, honest service.</p>
    <p>Whether you're looking for ammunition, tactical gear, firearms, or parts, we've got what you need—and at prices you'll appreciate.</p>
    <a href="<?php echo esc_url(home_url('/about')); ?>" class="about-cta-link">Learn More About Us →</a>
  </section>
</main>

<script>
function scrollCarousel(direction) {
  const carousel = document.getElementById('featured-carousel');
  if (carousel) carousel.scrollLeft += direction * 320;
}
</script>

<?php get_footer(); ?>
