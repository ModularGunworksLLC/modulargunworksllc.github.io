<?php
/**
 * Local NAP, Customizer settings, JSON-LD for LocalBusiness / FAQPage / WebSite.
 *
 * @package ModularGunworks
 */

defined( 'ABSPATH' ) || exit;

/**
 * Theme mods for store address / map / FFL certificate URL.
 *
 * Configure under Appearance → Customize → Modular Gunworks — Local SEO.
 *
 * @return void
 */
function modulargunworks_customize_register_local( WP_Customize_Manager $wp_customize ) {
	$wp_customize->add_section(
		'mgw_local_seo',
		array(
			'title'       => __( 'Modular Gunworks — Local SEO', 'modulargunworks' ),
			'description' => __( 'Street address and map power LocalBusiness schema and contact pages. Leave street blank until you are ready to publish.', 'modulargunworks' ),
			'priority'    => 85,
		)
	);

	$settings = array(
		'mgw_store_street'          => array(
			'label'   => __( 'Street address', 'modulargunworks' ),
			'default' => '',
			'type'    => 'text',
		),
		'mgw_store_city'            => array(
			'label'   => __( 'City', 'modulargunworks' ),
			'default' => 'Huntsville',
			'type'    => 'text',
		),
		'mgw_store_state'           => array(
			'label'   => __( 'State (2 letters)', 'modulargunworks' ),
			'default' => 'AL',
			'type'    => 'text',
		),
		'mgw_store_zip'             => array(
			'label'   => __( 'ZIP', 'modulargunworks' ),
			'default' => '',
			'type'    => 'text',
		),
		'mgw_store_phone'           => array(
			'label'   => __( 'Business phone (E.164 or display)', 'modulargunworks' ),
			'default' => '+12563843852',
			'type'    => 'text',
		),
		'mgw_google_maps_embed_url' => array(
			'label'   => __( 'Google Maps embed URL (src only)', 'modulargunworks' ),
			'default' => '',
			'type'    => 'url',
		),
		'mgw_ffl_pdf_url'           => array(
			'label'   => __( 'FFL license PDF URL (Media Library)', 'modulargunworks' ),
			'default' => '',
			'type'    => 'url',
		),
	);

	foreach ( $settings as $id => $cfg ) {
		$sanitize = 'url' === $cfg['type'] ? 'esc_url_raw' : 'modulargunworks_sanitize_local_setting';
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $cfg['default'],
				'sanitize_callback' => $sanitize,
				'transport'         => 'refresh',
			)
		);
		$control_type = ( 'url' === $cfg['type'] ) ? 'url' : 'text';
		$wp_customize->add_control(
			$id,
			array(
				'label'   => $cfg['label'],
				'section' => 'mgw_local_seo',
				'type'    => $control_type,
			)
		);
	}

	$wp_customize->add_section(
		'mgw_site_extras',
		array(
			'title'       => __( 'Modular Gunworks — Newsletter', 'modulargunworks' ),
			'description' => __( 'Paste your mailing-list form action URL (e.g. Mailchimp / Brevo embedded form action). Leave blank to disable submissions.', 'modulargunworks' ),
			'priority'    => 86,
		)
	);
	$wp_customize->add_setting(
		'mgw_newsletter_form_action',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'mgw_newsletter_form_action',
		array(
			'label'   => __( 'Newsletter form action URL', 'modulargunworks' ),
			'section' => 'mgw_site_extras',
			'type'    => 'url',
		)
	);
}
add_action( 'customize_register', 'modulargunworks_customize_register_local' );

/**
 * @param mixed $value Raw value.
 * @return string
 */
function modulargunworks_sanitize_local_setting( $value ) {
	if ( is_string( $value ) ) {
		return sanitize_text_field( $value );
	}
	return '';
}

/**
 * Get a single local SEO theme mod.
 *
 * @param string $key Setting key without prefix issues.
 * @param string $default Default.
 * @return string
 */
function modulargunworks_get_local( $key, $default = '' ) {
	$v = get_theme_mod( $key, $default );
	return is_string( $v ) ? $v : $default;
}

/**
 * Formatted street / city / state ZIP for display.
 *
 * @return string HTML-safe single line or block (use esc_html when outputting).
 */
function modulargunworks_get_address_display() {
	$street = trim( modulargunworks_get_local( 'mgw_store_street' ) );
	$city   = trim( modulargunworks_get_local( 'mgw_store_city', 'Huntsville' ) );
	$state  = strtoupper( trim( modulargunworks_get_local( 'mgw_store_state', 'AL' ) ) );
	$zip    = trim( modulargunworks_get_local( 'mgw_store_zip' ) );

	$line2 = trim( $city . ', ' . $state . ( $zip !== '' ? ' ' . $zip : '' ) );

	if ( $street !== '' ) {
		return $street . "\n" . $line2;
	}
	return $line2;
}

/**
 * Uploaded FFL license PDF URL from Customizer.
 *
 * @return string
 */
function modulargunworks_get_ffl_pdf_url() {
	return trim( modulargunworks_get_local( 'mgw_ffl_pdf_url' ) );
}

/**
 * Safe Google Maps embed URL (HTTPS iframe src).
 *
 * @return string
 */
function modulargunworks_get_maps_embed_url() {
	return trim( modulargunworks_get_local( 'mgw_google_maps_embed_url' ) );
}

/**
 * Telephone for schema (digits + leading +).
 *
 * @return string
 */
function modulargunworks_get_phone_schema() {
	$raw = modulargunworks_get_local( 'mgw_store_phone', '+12563843852' );
	$d   = preg_replace( '/\D+/', '', (string) $raw );
	if ( strlen( $d ) === 10 ) {
		return '+1' . $d;
	}
	if ( strlen( $d ) === 11 && '1' === $d[0] ) {
		return '+' . $d;
	}
	return $raw !== '' ? $raw : '+12563843852';
}

/**
 * Output JSON-LD LocalBusiness + WebSite in head (front page emphasis; sitewide entity).
 *
 * @return void
 */
function modulargunworks_print_schema_organization() {
	$street = trim( modulargunworks_get_local( 'mgw_store_street' ) );
	$city   = trim( modulargunworks_get_local( 'mgw_store_city', 'Huntsville' ) );
	$state  = strtoupper( trim( modulargunworks_get_local( 'mgw_store_state', 'AL' ) ) );
	$zip    = trim( modulargunworks_get_local( 'mgw_store_zip' ) );

	$graph = array();

	$local_business = array(
		'@type'       => array( 'LocalBusiness', 'Store' ),
		'@id'         => home_url( '/#business' ),
		'name'        => 'Modular Gunworks LLC',
		'url'         => home_url( '/' ),
		'description' => 'Veteran-owned licensed FFL gun shop in Huntsville, Alabama. FFL transfers, gunsmithing, and compliant online sales.',
		'telephone'   => modulargunworks_get_phone_schema(),
		'address'     => array(
			'@type'           => 'PostalAddress',
			'addressLocality' => $city,
			'addressRegion'   => $state,
			'addressCountry'  => 'US',
		),
	);

	if ( $street !== '' ) {
		$local_business['address']['streetAddress'] = $street;
	}
	if ( $zip !== '' ) {
		$local_business['address']['postalCode'] = $zip;
	}

	$graph[] = $local_business;

	$website = array(
		'@type'       => 'WebSite',
		'@id'         => home_url( '/#website' ),
		'url'         => home_url( '/' ),
		'name'        => 'Modular Gunworks LLC',
		'publisher'   => array( '@id' => home_url( '/#business' ) ),
		'potentialAction' => array(
			'@type'       => 'SearchAction',
			'target'      => home_url( '/shop/?post_type=product&s={search_term_string}' ),
			'query-input' => 'required name=search_term_string',
		),
	);
	$graph[] = $website;

	$payload = array(
		'@context' => 'https://schema.org',
		'@graph'   => $graph,
	);

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<script type="application/ld+json">' . wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}
add_action( 'wp_head', 'modulargunworks_print_schema_organization', 20 );

/**
 * FAQPage JSON-LD for FFL transfers template.
 *
 * @return void
 */
function modulargunworks_print_ffl_faq_schema() {
	if ( ! is_page( 'ffl-transfers' ) ) {
		return;
	}

	$faqs = array(
		array(
			'q' => __( 'How do I list Modular Gunworks as my receiving FFL?', 'modulargunworks' ),
			'a' => __( 'When you checkout with an online retailer, choose an FFL transfer and enter our business name and address (shown on our Contact page and FFL transfers page). We will match the shipment to your order when it arrives.', 'modulargunworks' ),
		),
		array(
			'q' => __( 'How long does an FFL transfer take in Huntsville?', 'modulargunworks' ),
			'a' => __( 'Transfers depend on carrier delivery and scheduling. We contact you when your firearm is ready for pickup and background check at our Huntsville location.', 'modulargunworks' ),
		),
		array(
			'q' => __( 'What if my background check is delayed or denied?', 'modulargunworks' ),
			'a' => __( 'We follow all federal and state procedures. See our Terms and Returns policies for refused transfers, return shipping fees, and restocking when applicable.', 'modulargunworks' ),
		),
		array(
			'q' => __( 'Can I transfer multiple firearms at once?', 'modulargunworks' ),
			'a' => __( 'Yes. Additional firearms transferred in the same transaction receive our posted multi-gun discount on transfer fees.', 'modulargunworks' ),
		),
	);

	$entities = array();
	foreach ( $faqs as $row ) {
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $row['q'],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $row['a'],
			),
		);
	}

	$payload = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $entities,
	);

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<script type="application/ld+json">' . wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}
add_action( 'wp_footer', 'modulargunworks_print_ffl_faq_schema', 20 );

/**
 * Detect popular SEO plugins so we do not duplicate meta tags.
 *
 * @return bool
 */
function modulargunworks_has_seo_plugin() {
	if ( defined( 'WPSEO_VERSION' ) || defined( 'WPSEO_PREMIUM_VERSION' ) ) {
		return true;
	}
	if ( class_exists( 'RankMath', false ) || class_exists( 'RankMath\\Helper', false ) ) {
		return true;
	}
	if ( defined( 'AIOSEO_VERSION' ) || defined( 'AIOSEO_PRO_VERSION' ) ) {
		return true;
	}
	if ( defined( 'SEOPRESS_VERSION' ) || defined( 'SEOPRESS_PRO_VERSION' ) ) {
		return true;
	}
	if ( function_exists( 'the_seo_framework' ) ) {
		return true;
	}
	return (bool) apply_filters( 'modulargunworks_has_seo_plugin', false );
}

/**
 * Default meta descriptions when no SEO plugin is active.
 *
 * @return string
 */
function modulargunworks_fallback_meta_description() {
	if ( is_front_page() ) {
		return __( 'Veteran-owned FFL gun shop in Huntsville, Alabama. Affordable FFL transfers, gunsmithing, and a full online firearms & ammunition catalog shipped nationwide.', 'modulargunworks' );
	}

	if ( is_page() ) {
		$page = get_queried_object();
		$slug = ( $page && isset( $page->post_name ) ) ? (string) $page->post_name : '';
		$map  = array(
			'ffl-transfers'        => __( 'FFL transfers in Huntsville, AL — fees, pickup process, and how to ship online purchases to Modular Gunworks.', 'modulargunworks' ),
			'contact'              => __( 'Contact Modular Gunworks LLC in Huntsville, Alabama — phone, email, hours, map, FFL transfers, and customer support.', 'modulargunworks' ),
			'services'             => __( 'Gunsmithing, FFL transfer services, and counter support at Modular Gunworks in Huntsville, Alabama.', 'modulargunworks' ),
			'gunsmithing'          => __( 'Gunsmithing services in Huntsville, AL at Modular Gunworks — cleaning, mounting, inspections, and more.', 'modulargunworks' ),
			'about'                => __( 'About Modular Gunworks — veteran-owned gun shop & licensed FFL serving Huntsville and North Alabama.', 'modulargunworks' ),
			'faq'                  => __( 'FAQ for Modular Gunworks — shipping, returns, FFL transfers, orders, and policies at our Huntsville FFL.', 'modulargunworks' ),
			'terms'                => __( 'Terms of Service for Modular Gunworks LLC — eligibility, firearms shipping, pricing, and compliance.', 'modulargunworks' ),
			'returns'              => __( 'Returns and final sale policy for Modular Gunworks — firearms, ammunition, accessories, and transfers.', 'modulargunworks' ),
			'privacy'              => __( 'Privacy policy for Modular Gunworks LLC — data use, disclosure, and security.', 'modulargunworks' ),
			'state-restrictions'   => __( 'State shipping restrictions for firearms and ammunition — Modular Gunworks compliance overview.', 'modulargunworks' ),
			'firearm-transfer-guide' => __( 'How firearm FFL transfers work when you buy online — Modular Gunworks Huntsville guide.', 'modulargunworks' ),
		);
		if ( isset( $map[ $slug ] ) ) {
			return $map[ $slug ];
		}
	}

	if ( function_exists( 'is_shop' ) && is_shop() ) {
		return __( 'Shop firearms, ammunition, optics, and accessories online at Modular Gunworks — veteran-owned FFL in Huntsville, Alabama.', 'modulargunworks' );
	}

	if ( function_exists( 'is_product_category' ) && is_product_category() ) {
		$term = get_queried_object();
		if ( $term && ! is_wp_error( $term ) && isset( $term->name ) ) {
			/* translators: %s category name */
			return sprintf( __( 'Browse %1$s at Modular Gunworks — licensed FFL & gun shop in Huntsville, Alabama.', 'modulargunworks' ), $term->name );
		}
	}

	if ( function_exists( 'is_product' ) && is_product() ) {
		$product = wc_get_product( get_queried_object_id() );
		if ( $product ) {
			$snippet = wp_strip_all_tags( (string) $product->get_short_description() );
			if ( $snippet === '' ) {
				$snippet = wp_strip_all_tags( (string) $product->get_description() );
			}
			$snippet = trim( preg_replace( '/\s+/', ' ', $snippet ) );
			if ( $snippet !== '' ) {
				$snippet = function_exists( 'mb_substr' ) ? mb_substr( $snippet, 0, 155 ) : substr( $snippet, 0, 155 );
			}
			/* translators: %s product title */
			$tail = sprintf( __( 'Buy %s at Modular Gunworks — Huntsville AL FFL dealer.', 'modulargunworks' ), $product->get_name() );
			return $snippet !== '' ? $snippet . ' ' . $tail : $tail;
		}
	}

	return '';
}

/**
 * Print meta description if no SEO plugin handles it.
 *
 * @return void
 */
function modulargunworks_print_fallback_meta_description() {
	if ( ! apply_filters( 'modulargunworks_enable_fallback_meta', true ) ) {
		return;
	}
	if ( modulargunworks_has_seo_plugin() ) {
		return;
	}
	$desc = apply_filters( 'modulargunworks_meta_description', modulargunworks_fallback_meta_description() );
	$desc = trim( wp_strip_all_tags( (string) $desc ) );
	if ( $desc === '' ) {
		return;
	}
	echo '<meta name="description" content="' . esc_attr( $desc ) . '" />' . "\n";
}
add_action( 'wp_head', 'modulargunworks_print_fallback_meta_description', 3 );
