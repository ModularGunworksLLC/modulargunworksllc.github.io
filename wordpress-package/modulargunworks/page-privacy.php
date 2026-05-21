<?php
/**
 * Template: Privacy Policy
 */
get_header();
?>
<main>
  <h1 class="page-title"><?php esc_html_e( 'Privacy Policy', 'modulargunworks' ); ?></h1>
  <div class="content-section">
    <p><strong><?php esc_html_e( 'Last Updated: February 2026', 'modulargunworks' ); ?></strong></p>
    <p><?php esc_html_e( 'Modular Gunworks LLC respects your privacy. This policy explains what we collect, how we use it, and whom we disclose it to.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Information we collect', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Identifiers and contact fields you supply (name, email, mailing address, phone), account credentials when you register, transactional data (SKU history, totals), payment tokens processed by gateways, firearm transfer records required by BATFE/state law, diagnostics from website logs, and correspondence you voluntarily send.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Use of information', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'We process data to fulfill orders, verify FFLs, ship packages, deter fraud, provide customer care, comply with regulators, defend legal claims, and improve site security.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Disclosures', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Modular Gunworks does not sell or rent personally identifiable consumer marketing lists.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'We share limited data with service processors who help us operate: payment gateways, ecommerce hosting, transactional email carriers, fulfillment partners, auditors, firearms distributors, shipping carriers (UPS/FedEx/USPS/etc.), transferring FFLs, and lawful requests from governmental authorities—including ATF NFA branch workflows if you initiate regulated transfers.', 'modulargunworks' ); ?></p>
    <p><?php esc_html_e( 'As we broaden regulated offerings such as NFA items or SOT services, supplementary forms and BATFE-required retention may apply; notice will be refreshed when those launches occur.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Security & retention', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Firearm transaction records maintain statutory retention windows. Electronic safeguards follow reasonable industry measures; payments are routed through PCI-DSS-aligned processors.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Marketing & communications', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Signing up for newsletters implies consent under applicable marketing law; unsubscribe links accompany each campaign.', 'modulargunworks' ); ?></p>

    <h2><?php esc_html_e( 'Rights & contact', 'modulargunworks' ); ?></h2>
    <p><?php esc_html_e( 'Residents in states with supplemental privacy statutes may possess additional notices or rights—we will comply when jurisdictional thresholds are met.', 'modulargunworks' ); ?></p>
    <p><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>"><?php esc_html_e( 'Privacy questions?', 'modulargunworks' ); ?></a> <?php esc_html_e( '(256) 384-3852', 'modulargunworks' ); ?></p>
  </div>
</main>
<style>.content-section{max-width:800px;}.content-section h2{font-size:1.25rem;margin:1.5rem 0 .5rem;}.content-section p{color:#666;line-height:1.6;margin-bottom:1rem;}</style>
<?php get_footer(); ?>
