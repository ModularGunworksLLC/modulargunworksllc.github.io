<?php
/**
 * Template: Returns
 */
get_header();
?>
<main>
  <h1 class="page-title"><?php esc_html_e( 'Returns & Final Sales', 'modulargunworks' ); ?></h1>
  <div class="content-section">
    <p><strong><?php esc_html_e( 'Last Updated: February 2026', 'modulargunworks' ); ?></strong></p>
    <p><?php echo wp_kses_post( __( 'Certain items—including firearms (once transfer paperwork is executed) and most ammunition sales—are generally <strong>final</strong> for compliance and safety reasons unless the law mandates otherwise.', 'modulargunworks' ) ); ?></p>

    <h2><?php esc_html_e( 'Firearms & ammunition', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'All firearm and ammunition sales are final once lawful transfer paperwork is executed or ammunition leaves our control pursuant to shipment rules.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'Inspect items at your receiving FFL before completing the Form 4473 (or equivalent). After the transfer is approved and you take possession the firearm is yours and not returnable because you changed your mind.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'For used, estate, consignment, or auction-style listings we provide descriptions and photos to the extent practicable. By completing the transaction you acknowledge those materials were your inspection opportunity absent fraud or concealment attributable to Modular Gunworks.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Transfers that fail background checks', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'When we ship outbound to another licensee and your buyer fails or abandons their background investigation, lawful storage/return freight and restocking rules from our Terms apply so we are not asked to subsidize preventable compliance failures.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Eligible non-regulated merchandise', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Accessory and consumer items that lawfully may be shipped direct (where not hazmat-restricted) may be eligible for return within thirty (30) days of delivery when unused, in salable packaging, and after you receive a written return merchandise authorization.', 'modulargunworks' ); ?></p>
    <ol>
      <li><?php echo wp_kses_post( __( 'Email <a href="mailto:sales@modulargunworks.com">sales@modulargunworks.com</a> or call (256) 384-3852 with your order number.', 'modulargunworks' ) ); ?></li>
      <li><?php esc_html_e( 'We send RMA instructions; unauthorized returns may be refused.', 'modulargunworks' ); ?></li>
      <li><?php esc_html_e( 'Refunds typically post within five to seven business days after we inspect the return.', 'modulargunworks' ); ?></li>
    </ol>

    <h2><?php esc_html_e( 'Damaged or incorrect shipments', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Inspect packages promptly and contact us immediately with photographs for carrier damage or our fulfillment mistakes. If we verified the defect we coordinate replacement/refund remedies subject to distributor rules.', 'modulargunworks' ); ?></p>

    <p><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>"><?php esc_html_e( 'Need help? Reach our team.', 'modulargunworks' ); ?></a></p>
  </div>
</main>
<style>.content-section{max-width:800px;}.content-section h2{font-size:1.25rem;margin:1.5rem 0 .5rem;}.content-section p,.content-section ol,.content-section li{color:#666;line-height:1.6;margin-bottom:1rem;}.content-section ol{padding-left:1.5rem;}</style>
<?php get_footer(); ?>
