<?php
/**
 * Template: Contact Us
 */
get_header();
$maps_src = function_exists( 'modulargunworks_get_maps_embed_url' ) ? modulargunworks_get_maps_embed_url() : '';
?>
<main>
  <section class="contact-hero">
    <h1 class="page-title"><?php esc_html_e( 'Contact Us', 'modulargunworks' ); ?></h1>
    <p class="contact-hero-subtitle"><?php esc_html_e( 'Questions about orders, transfers, or services? Call, email, or visit our Huntsville-area FFL storefront.', 'modulargunworks' ); ?></p>
  </section>

  <div class="contact-wrapper">
    <div class="contact-info contact-card">
      <h2><?php esc_html_e( 'Get in Touch', 'modulargunworks' ); ?></h2>
      <p class="contact-intro"><?php esc_html_e( 'We are happy to help locals and online buyers using us as a receiving FFL.', 'modulargunworks' ); ?></p>
      <div class="info-item">
        <span class="info-icon"><i class="fas fa-phone"></i></span>
        <div class="info-content">
          <h3><?php esc_html_e( 'Phone', 'modulargunworks' ); ?></h3>
          <p><a href="tel:+12563843852">(256) 384-3852</a></p>
        </div>
      </div>
      <div class="info-item">
        <span class="info-icon"><i class="fas fa-envelope"></i></span>
        <div class="info-content">
          <h3><?php esc_html_e( 'Email', 'modulargunworks' ); ?></h3>
          <p><a href="mailto:info@modulargunworks.com">info@modulargunworks.com</a></p>
        </div>
      </div>
      <div class="info-item">
        <span class="info-icon"><i class="fas fa-map-marker-alt"></i></span>
        <div class="info-content">
          <h3><?php esc_html_e( 'Location', 'modulargunworks' ); ?></h3>
          <?php if ( function_exists( 'modulargunworks_get_address_display' ) ) : ?>
            <p class="contact-address-block"><?php echo esc_html( modulargunworks_get_address_display() ); ?></p>
          <?php else : ?>
            <p>Huntsville, AL</p>
          <?php endif; ?>
          <p><strong><?php esc_html_e( 'Hours:', 'modulargunworks' ); ?></strong> <?php esc_html_e( 'M-F 9AM-6PM, Sat 10AM-4PM CT', 'modulargunworks' ); ?></p>
          <p class="contact-ffl-link"><a href="<?php echo esc_url( home_url( '/ffl-transfers/' ) ); ?>"><?php esc_html_e( 'FFL transfer info & fees →', 'modulargunworks' ); ?></a></p>
        </div>
      </div>
    </div>
    <div class="contact-form-section contact-card">
      <h2><?php esc_html_e( 'Send a Message', 'modulargunworks' ); ?></h2>
      <?php if ( shortcode_exists( 'contact-form-7' ) ) : ?>
        <?php echo do_shortcode( '[contact-form-7 title="Contact"]' ); ?>
      <?php elseif ( shortcode_exists( 'wpforms' ) ) : ?>
        <?php echo do_shortcode( '[wpforms id="1"]' ); ?>
      <?php elseif ( shortcode_exists( 'fluentform' ) ) : ?>
        <?php echo do_shortcode( '[fluentform id="1"]' ); ?>
      <?php else : ?>
        <p class="contact-plugin-note">
          <?php esc_html_e( 'Install Contact Form 7, WPForms Lite, or Fluent Forms and paste the shortcode on this template.', 'modulargunworks' ); ?>
        </p>
      <?php endif; ?>
      <p class="contact-direct-email"><?php esc_html_e( 'Prefer email?', 'modulargunworks' ); ?> <a href="mailto:info@modulargunworks.com">info@modulargunworks.com</a></p>
    </div>
  </div>

  <?php if ( $maps_src !== '' ) : ?>
  <section class="contact-map-section" aria-label="<?php esc_attr_e( 'Map', 'modulargunworks' ); ?>">
    <div class="mgw-map-embed">
      <iframe
        src="<?php echo esc_url( $maps_src ); ?>"
        style="border:0;"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="<?php esc_attr_e( 'Modular Gunworks map', 'modulargunworks' ); ?>"></iframe>
    </div>
    <p class="contact-map-note"><?php esc_html_e( 'Call ahead if you need suite, gate, or after-hours instructions.', 'modulargunworks' ); ?></p>
  </section>
  <?php endif; ?>
</main>
<style>
.contact-hero{max-width:1000px;margin:0 auto 1.5rem;}
.contact-hero .page-title{margin-bottom:.5rem;}
.contact-hero-subtitle{color:#555;max-width:760px;line-height:1.5;}
.contact-wrapper{display:grid;grid-template-columns:1fr 1.15fr;gap:1.5rem;max-width:1000px;margin:0 auto 2rem;}
.contact-card{background:#fff;border:1px solid #e3e3e3;border-radius:12px;padding:1.25rem 1.25rem 1rem;box-shadow:0 1px 3px rgba(0,0,0,.04);}
.contact-info h2,.contact-form-section h2{font-size:1.35rem;margin-bottom:.75rem;color:var(--color-bg-dark);}
.contact-intro{color:#555;line-height:1.45;margin-bottom:1rem;}
.info-item{display:flex;gap:.85rem;align-items:flex-start;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #eee;}
.info-item:last-child{border-bottom:0;padding-bottom:0;margin-bottom:0;}
.info-icon{font-size:1.05rem;color:var(--color-primary);width:24px;margin-top:.25rem;}
.info-content h3{font-size:1.1rem;margin:0 0 .3rem;}
.info-content p{margin:.2rem 0;line-height:1.4;}
.info-content a{color:var(--color-primary);}
.contact-address-block{white-space:pre-line;margin:.25rem 0;}
.contact-map-section{max-width:1000px;margin:0 auto 2.5rem;padding:0 1rem;}
.mgw-map-embed{position:relative;width:100%;aspect-ratio:16/9;max-height:420px;background:#eaeaea;border-radius:12px;overflow:hidden;}
.mgw-map-embed iframe{position:absolute;inset:0;width:100%;height:100%;}
.contact-map-note{font-size:.9rem;color:#666;margin-top:.75rem;}
.contact-form-section .wpcf7{margin-top:.35rem;}
.contact-form-section .wpcf7-form p{margin:.6rem 0;}
.contact-form-section input[type="text"],
.contact-form-section input[type="email"],
.contact-form-section input[type="tel"],
.contact-form-section textarea{width:100%;max-width:100%;padding:.6rem .7rem;border:1px solid #cfcfcf;border-radius:8px;font-size:16px;}
.contact-form-section textarea{min-height:120px;resize:vertical;}
.contact-form-section .wpcf7-submit{background:var(--color-primary);color:#fff;border:0;border-radius:8px;padding:.65rem 1.1rem;font-weight:600;cursor:pointer;min-height:44px;}
.contact-form-section .wpcf7-submit:hover{background:#8b1a1a;color:#fff;}
.contact-plugin-note{background:#f9f9f9;padding:1rem;border-radius:8px;border:1px solid #ddd;color:#444;}
.contact-direct-email{margin-top:1rem;font-size:.95rem;color:#666;}
@media(max-width:900px){.contact-wrapper{grid-template-columns:1fr;}}
</style>
<?php get_footer(); ?>
