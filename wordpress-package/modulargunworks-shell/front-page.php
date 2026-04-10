<?php
/**
 * Home: same visual structure as legacy theme; category cards use neutral copy until catalog returns.
 */
get_header();
?>

<main>
  <section class="hero-section">
    <h2>Lower Prices. Same Quality. Huntsville-Based.</h2>
    <p>Why pay national prices when we ship fast from Alabama? Quality firearms, ammunition, and gear at prices you'll love.</p>
    <div class="hero-cta-buttons">
      <?php
      $shop_url = function_exists( 'wc_get_page_permalink' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/shop' );
      $ammo_url = ( function_exists( 'get_term_by' ) && taxonomy_exists( 'product_cat' ) ) ? ( get_term_by( 'slug', 'ammunition', 'product_cat' ) ? get_term_link( get_term_by( 'slug', 'ammunition', 'product_cat' ) ) : $shop_url . '?product_cat=ammunition' ) : $shop_url;
      $gear_url = ( function_exists( 'get_term_by' ) && taxonomy_exists( 'product_cat' ) ) ? ( get_term_by( 'slug', 'gear', 'product_cat' ) ? get_term_link( get_term_by( 'slug', 'gear', 'product_cat' ) ) : $shop_url . '?product_cat=gear' ) : $shop_url;
      if ( is_wp_error( $ammo_url ) ) {
        $ammo_url = $shop_url;
      }
      if ( is_wp_error( $gear_url ) ) {
        $gear_url = $shop_url;
      }
      ?>
      <a href="<?php echo esc_url( $ammo_url ); ?>" class="hero-cta-btn primary">Shop Ammunition</a>
      <a href="<?php echo esc_url( $gear_url ); ?>" class="hero-cta-btn secondary">Browse Gear & Parts</a>
    </div>
  </section>

  <section class="carousel-section">
    <h2 class="section-title">Shop by Category</h2>
    <div class="carousel-container">
      <div class="carousel" id="featured-carousel">
        <?php
        $categories = array(
          array( 'slug' => 'ammunition', 'name' => 'Ammunition', 'tag' => 'Browse rounds', 'img' => 'ammunition.jpg' ),
          array( 'slug' => 'magazines', 'name' => 'Magazines', 'tag' => 'Browse magazines', 'img' => 'magazines.jpg' ),
          array( 'slug' => 'firearms', 'name' => 'Firearms', 'tag' => 'Handguns, rifles & shotguns', 'img' => 'gear.jpg' ),
          array( 'slug' => 'gun-parts', 'name' => 'Gun Parts', 'tag' => 'Browse parts', 'img' => 'gun-parts.jpg' ),
          array( 'slug' => 'gear', 'name' => 'Tactical Gear', 'tag' => 'Browse gear', 'img' => 'gear.jpg' ),
          array( 'slug' => 'optics', 'name' => 'Optics & Sights', 'tag' => 'Browse optics', 'img' => 'optics.jpg' ),
          array( 'slug' => 'reloading', 'name' => 'Reloading', 'tag' => 'Browse reloading', 'img' => 'reloading.jpg' ),
          array( 'slug' => 'outdoors', 'name' => 'Outdoors', 'tag' => 'Browse outdoors', 'img' => 'outdoors.jpg' ),
          array( 'slug' => 'brands', 'name' => 'Shop by Brand', 'tag' => 'Browse brands', 'img' => 'brands.jpg' ),
        );
        $shop_url    = function_exists( 'wc_get_page_permalink' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/shop' );
        $brands_page = get_page_by_path( 'brands' );
        foreach ( $categories as $cat ) :
          if ( 'brands' === $cat['slug'] ) {
            $url = ( $brands_page ? get_permalink( $brands_page ) : home_url( '/brands/' ) );
          } else {
            $term = function_exists( 'get_term_by' ) && taxonomy_exists( 'product_cat' ) ? get_term_by( 'slug', $cat['slug'], 'product_cat' ) : null;
            $url  = $term && ! is_wp_error( get_term_link( $term ) ) ? get_term_link( $term ) : ( $shop_url . '?product_cat=' . $cat['slug'] );
          }
          $img_path = get_template_directory_uri() . '/assets/images/categories/' . $cat['img'];
          ?>
        <div class="carousel-item">
          <a href="<?php echo esc_url( $url ); ?>" class="category-card">
            <img src="<?php echo esc_url( $img_path ); ?>" alt="<?php echo esc_attr( $cat['name'] ); ?>">
            <h3><?php echo esc_html( $cat['name'] ); ?></h3>
            <p><?php echo esc_html( $cat['tag'] ); ?></p>
          </a>
        </div>
          <?php
        endforeach;
        ?>
      </div>
      <div class="carousel-controls">
        <button type="button" class="carousel-btn" onclick="mgwShellScrollCarousel(-1)">❮</button>
        <button type="button" class="carousel-btn" onclick="mgwShellScrollCarousel(1)">❯</button>
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
        <p>Trusted brands and products you can rely on.</p>
      </div>
    </div>
  </section>

  <section class="about-section">
    <h2>About Modular Gunworks</h2>
    <p>Veteran-owned gun shop in Huntsville serving customers locally and nationwide. We believe in providing quality products at competitive prices with straightforward, honest service.</p>
    <p>Whether you're looking for ammunition, tactical gear, firearms, or parts, we've got what you need—and at prices you'll appreciate.</p>
    <a href="<?php echo esc_url( home_url( '/about' ) ); ?>" class="about-cta-link">Learn More About Us →</a>
  </section>
</main>

<script>
function mgwShellScrollCarousel(direction) {
  var carousel = document.getElementById('featured-carousel');
  if (carousel) carousel.scrollLeft += direction * 320;
}
</script>

<?php
get_footer();
