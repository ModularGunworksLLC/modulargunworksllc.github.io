<?php
/**
 * Template: Terms & Conditions
 */
get_header();
?>
<main>
  <h1 class="page-title"><?php esc_html_e( 'Terms of Service', 'modulargunworks' ); ?></h1>
  <div class="content-section">
    <p><strong><?php esc_html_e( 'Last Updated: February 2026', 'modulargunworks' ); ?></strong></p>
    <p><?php esc_html_e( 'These Terms govern your access to Modular Gunworks LLC’s website and your purchase or use of our products and services. By placing an order or using this site you agree to these Terms and our Returns and Privacy policies.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Eligibility & transferee acknowledgement', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'You must comply with federal, state, and local laws. Age requirements commonly include 21+ for handguns (and handgun ammunition and frames/receivers in many jurisdictions) and 18+ for rifles, shotguns, and rifle/shotgun ammunition—but your location may differ.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'You represent that you are the actual transferee/purchaser, that you are not legally prohibited from receiving or possessing the items ordered, and that shipment and possession where you reside are lawful. Modular Gunworks may refuse or cancel any order if we believe a straw purchase, fraud, or other violation may occur.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Orders, pricing accuracy & cancellations', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Pricing, availability, and descriptions rely on catalogs and integrations; mistakes can occur despite our diligence. Prices are subject to change without notice.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'If an item’s price was listed incorrectly due to manual error, distributor feed anomalies, or technical glitches, we may cancel the order and issue a full refund for any payment collected. We will attempt to notify you promptly when that happens.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'All orders are subject to acceptance, inventory, and compliance review. Payment must be authorized before shipment unless we expressly agree otherwise.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Firearms, ammunition & regulated items', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Firearms must ship to a licensed FFL (not a residence or P.O. box). You must complete an ATF Form 4473 and any required background checks at the receiving dealer or at our counter per applicable law.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'Once a firearm transfer is completed and the 4473 process is finished (or once you take possession where law allows), the sale is final except as required by law or a written warranty from the manufacturer.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'Ammunition and other regulated commodities are also generally final sale; see our Returns policy for carve-outs such as lawful defects or fulfillment errors attributable to Modular Gunworks.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Used, estate, auction, or consignment items', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'When listed, items may include descriptive text and imagery. Inspect with your transferring FFL where applicable.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'Except where expressly prohibited by law, all firearm and ammunition sales remain final notwithstanding cosmetic variances.', 'modulargunworks' ); ?></p>

    <h2 id="mgw-shipping-failed-transfers"><?php esc_html_e( 'Shipping & failed transfers', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Risk of loss follows carrier rules once the package leaves our control unless otherwise mandated by law.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'If we ship to another FFL and the buyer fails a background check, abandons the transfer, or refuses lawful documentation, buyer is responsible for return freight, any storage fees permitted by policy, and, where allowable, up to a 15% restocking fee on the firearm’s purchase price.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'Outbound shipping charges are typically non-refundable once the package ships except when we materially erred.', 'modulargunworks' ); ?></p>
    <p><?php printf(
      wp_kses(
        /* translators: %1$s restrictions url, %2$s returns url */
        __( 'Compliance resources: read our <a href="%1$s">state restrictions summary</a> and <a href="%2$s">returns policy</a>.', 'modulargunworks' ),
        array(
          'a' => array( 'href' => array() ),
        )
      ),
      esc_url( home_url( '/state-restrictions/' ) ),
      esc_url( home_url( '/returns/' ) )
    ); ?></p>

    <h2><?php esc_html_e( 'Limitation of liability', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'To the maximum extent permitted by applicable law Modular Gunworks is not liable for indirect, incidental, special, consequential, or punitive damages. Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent still enforceable.', 'modulargunworks' ); ?></p>

    <p><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>"><?php esc_html_e( 'Contact us with questions about these Terms.', 'modulargunworks' ); ?></a></p>
  </div>
</main>
<style>.content-section{max-width:800px;}.content-section h2{font-size:1.25rem;margin:1.5rem 0 .5rem;}.content-section p,.content-section a{color:#666;line-height:1.6;margin-bottom:1rem;} .content-section a{color:var(--color-primary,#a52a2a);font-weight:600;}</style>
<?php get_footer(); ?>
