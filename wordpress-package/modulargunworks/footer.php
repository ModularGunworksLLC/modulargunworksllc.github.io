<footer>
  <div class="footer-content">
    <div class="footer-section">
      <h3>Shop</h3>
      <ul>
        <?php
        $shop_url = function_exists('wc_get_page_permalink') ? get_permalink(wc_get_page_id('shop')) : home_url('/shop');
        $footer_cats = ['ammunition', 'magazines', 'gun-parts', 'gear', 'optics', 'reloading', 'outdoors', 'brands'];
        $footer_names = ['Ammunition', 'Magazines', 'Gun Parts', 'Gear', 'Optics', 'Reloading', 'Outdoors', 'Brands'];
        $brands_page = get_page_by_path('brands');
        foreach ($footer_cats as $i => $slug) {
          if ($slug === 'brands') {
            $url = ($brands_page ? get_permalink($brands_page) : home_url('/brands/'));
          } else {
            $term = function_exists('get_term_by') && taxonomy_exists('product_cat') ? get_term_by('slug', $slug, 'product_cat') : null;
            $term_link = $term ? get_term_link($term) : '';
            $url = ($term && !is_wp_error($term_link)) ? $term_link : ($shop_url . '?product_cat=' . $slug);
          }
          echo '<li><a href="' . esc_url($url) . '">' . esc_html($footer_names[$i]) . '</a></li>';
        }
        ?>
      </ul>
    </div>

    <div class="footer-section">
      <h3>Company</h3>
      <ul>
        <li><a href="<?php echo esc_url(home_url('/about')); ?>">About Us</a></li>
        <li><a href="<?php echo esc_url(home_url('/contact')); ?>">Contact</a></li>
        <li><a href="<?php echo esc_url(home_url('/faq')); ?>">FAQ</a></li>
        <li><a href="<?php echo esc_url(home_url('/blog')); ?>">Blog</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h3>Legal</h3>
      <ul>
        <li><a href="<?php echo esc_url(home_url('/terms')); ?>">Terms & Conditions</a></li>
        <li><a href="<?php echo esc_url(home_url('/privacy')); ?>">Privacy Policy</a></li>
        <li><a href="<?php echo esc_url(home_url('/returns')); ?>">Returns</a></li>
        <li><a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>">FFL transfers in Huntsville</a></li>
        <li><a href="<?php echo esc_url(home_url('/order-status')); ?>">Order Status</a></li>
        <li><a href="<?php echo esc_url(home_url('/state-restrictions')); ?>">State Restrictions</a></li>
        <li><a href="<?php echo esc_url(home_url('/firearm-transfer-guide')); ?>">Firearm Transfer Guide</a></li>
      </ul>
    </div>

    <div class="footer-section footer-newsletter">
      <h3>Newsletter</h3>
      <p class="newsletter-tagline">Get deals & restock alerts</p>
      <?php
      $nl_action = function_exists( 'modulargunworks_get_local' ) ? trim( modulargunworks_get_local( 'mgw_newsletter_form_action' ) ) : '';
      $nl_has    = ( $nl_action !== '' && filter_var( $nl_action, FILTER_VALIDATE_URL ) );
      ?>
      <?php if ( ! $nl_has && current_user_can( 'manage_options' ) ) : ?>
        <p class="newsletter-admin-hint"><?php esc_html_e( 'Set “Newsletter form action URL” under Appearance → Customize to activate this form.', 'modulargunworks' ); ?></p>
      <?php endif; ?>
      <form class="newsletter-form" action="<?php echo $nl_has ? esc_url( $nl_action ) : ''; ?>" method="post"<?php echo $nl_has ? ' target="_blank" rel="noopener noreferrer"' : ' onsubmit="return false;" data-mgw-newsletter-inactive="1"'; ?>>
        <input type="text" name="FNAME" placeholder="<?php esc_attr_e( 'First name', 'modulargunworks' ); ?>" <?php echo $nl_has ? 'required' : 'disabled'; ?> autocomplete="given-name">
        <input type="email" name="EMAIL" placeholder="<?php esc_attr_e( 'Email', 'modulargunworks' ); ?>" <?php echo $nl_has ? 'required' : 'disabled'; ?> autocomplete="email">
        <button type="submit" <?php echo ! $nl_has ? 'disabled' : ''; ?>><?php esc_html_e( 'Sign up', 'modulargunworks' ); ?></button>
      </form>
    </div>

    <div class="footer-section">
      <h3>Contact</h3>
      <p><strong>Phone:</strong> <a href="tel:+12563843852">(256) 384-3852</a><br>
      <strong>Email:</strong> <a href="mailto:info@modulargunworks.com">info@modulargunworks.com</a><br>
      <?php if (function_exists('modulargunworks_get_address_display')) :
        $addr = modulargunworks_get_address_display();
        ?>
      <strong>Location:</strong><br><span class="footer-address-block"><?php echo esc_html($addr); ?></span><br>
      <?php else : ?>
      <strong>Location:</strong> Huntsville, AL<br>
      <?php endif; ?>
      <strong>Hours:</strong> M-F 9AM-6PM, Sat 10AM-4PM CT</p>
      <p><a href="<?php echo esc_url(home_url('/contact')); ?>"><?php esc_html_e('Directions & contact form →', 'modulargunworks'); ?></a></p>
    </div>
  </div>

  <div class="footer-local-strip footer-wide">
    <p><?php esc_html_e('Modular Gunworks LLC is a veteran-owned gun shop and licensed FFL in Huntsville, Alabama. We specialize in compliant FFL transfers for online buyers, in-store pickup, gunsmithing, and shipping lawful orders nationwide from our North Alabama operation.', 'modulargunworks'); ?></p>
    <div class="footer-local-quicklinks">
      <a href="<?php echo esc_url(home_url('/ffl-transfers')); ?>"><?php esc_html_e('FFL transfers in Huntsville', 'modulargunworks'); ?></a>
      <a href="<?php echo esc_url(home_url('/services')); ?>"><?php esc_html_e('Gunsmithing & services', 'modulargunworks'); ?></a>
      <a href="<?php echo esc_url(home_url('/contact')); ?>"><?php esc_html_e('Visit & contact', 'modulargunworks'); ?></a>
      <?php if (function_exists('wc_get_page_permalink')) : ?>
      <a href="<?php echo esc_url(wc_get_page_permalink('shop')); ?>"><?php esc_html_e('Shop the catalog', 'modulargunworks'); ?></a>
      <?php endif; ?>
    </div>
  </div>

  <div class="footer-bottom">
    <p>© <?php echo date('Y'); ?> Modular Gunworks LLC. All rights reserved. | Veteran-Owned Business in Huntsville, Alabama</p>
    <p>We are a licensed FFL and offer firearm sales and transfers in compliance with federal, state, and local laws.</p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
