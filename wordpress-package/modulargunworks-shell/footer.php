<footer>
  <div class="footer-content">
    <div class="footer-section">
      <h3>Shop</h3>
      <ul>
        <?php
        $shop_url = function_exists( 'wc_get_page_permalink' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/shop' );
        $footer_cats  = array( 'ammunition', 'magazines', 'gun-parts', 'gear', 'optics', 'reloading', 'outdoors', 'brands' );
        $footer_names = array( 'Ammunition', 'Magazines', 'Gun Parts', 'Gear', 'Optics', 'Reloading', 'Outdoors', 'Brands' );
        $brands_page  = get_page_by_path( 'brands' );
        foreach ( $footer_cats as $i => $slug ) {
          if ( 'brands' === $slug ) {
            $url = ( $brands_page ? get_permalink( $brands_page ) : home_url( '/brands/' ) );
          } else {
            $term      = function_exists( 'get_term_by' ) && taxonomy_exists( 'product_cat' ) ? get_term_by( 'slug', $slug, 'product_cat' ) : null;
            $term_link = $term ? get_term_link( $term ) : '';
            $url       = ( $term && ! is_wp_error( $term_link ) ) ? $term_link : ( $shop_url . '?product_cat=' . $slug );
          }
          echo '<li><a href="' . esc_url( $url ) . '">' . esc_html( $footer_names[ $i ] ) . '</a></li>';
        }
        ?>
      </ul>
    </div>

    <div class="footer-section">
      <h3>Company</h3>
      <ul>
        <li><a href="<?php echo esc_url( home_url( '/about' ) ); ?>">About Us</a></li>
        <li><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>">Contact</a></li>
        <li><a href="<?php echo esc_url( home_url( '/faq' ) ); ?>">FAQ</a></li>
        <li><a href="<?php echo esc_url( home_url( '/blog' ) ); ?>">Blog</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h3>Legal</h3>
      <ul>
        <li><a href="<?php echo esc_url( home_url( '/terms' ) ); ?>">Terms & Conditions</a></li>
        <li><a href="<?php echo esc_url( home_url( '/privacy' ) ); ?>">Privacy Policy</a></li>
        <li><a href="<?php echo esc_url( home_url( '/returns' ) ); ?>">Returns</a></li>
        <li><a href="<?php echo esc_url( home_url( '/order-status' ) ); ?>">Order Status</a></li>
        <li><a href="<?php echo esc_url( home_url( '/state-restrictions' ) ); ?>">State Restrictions</a></li>
        <li><a href="<?php echo esc_url( home_url( '/firearm-transfer-guide' ) ); ?>">Firearm Transfer Guide</a></li>
      </ul>
    </div>

    <div class="footer-section footer-newsletter">
      <h3>Newsletter</h3>
      <p class="newsletter-tagline">Get deals & restock alerts</p>
      <form class="newsletter-form" action="#" method="post">
        <input type="text" name="firstName" placeholder="First name" required>
        <input type="email" name="email" placeholder="Email" required>
        <button type="submit">Sign up</button>
      </form>
    </div>

    <div class="footer-section">
      <h3>Contact</h3>
      <p><strong>Phone:</strong> (256) 384-3852<br>
      <strong>Email:</strong> Info@modulargunworks.com<br>
      <strong>Location:</strong> Huntsville, AL<br>
      <strong>Hours:</strong> M-F 9AM-6PM, Sat 10AM-4PM CT</p>
    </div>
  </div>

  <div class="footer-bottom">
    <p>© <?php echo esc_html( (string) gmdate( 'Y' ) ); ?> Modular Gunworks LLC. All rights reserved. | Veteran-Owned Business in Huntsville, Alabama</p>
    <p>We are a licensed FFL and offer firearm sales and transfers in compliance with federal, state, and local laws.</p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
