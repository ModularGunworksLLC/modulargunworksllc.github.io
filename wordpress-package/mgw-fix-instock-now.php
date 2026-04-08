<?php
/**
 * Fix In Stock filter: Update all filter-set posts to use hide_empty = 'no'
 * Run: php mgw-fix-instock-now.php (from wordpress root) or load via browser
 */
$wp_load = '/opt/bitnami/wordpress/wp-load.php';
if ( ! file_exists( $wp_load ) ) {
    die( "WordPress not found at /opt/bitnami/wordpress\n" );
}
define( 'WP_USE_THEMES', false );
require_once $wp_load;

if ( ! defined( 'FLRT_FILTERS_SET_POST_TYPE' ) ) {
    die( "Filter Everything plugin not active.\n" );
}

$updated = 0;
$sets = get_posts( [
    'post_type'   => 'filter-set',
    'post_status' => 'any',
    'numberposts' => -1,
] );

foreach ( $sets as $post ) {
    $content = maybe_unserialize( $post->post_content );
    if ( ! is_array( $content ) ) {
        continue;
    }
    $changed = false;
    if ( ! isset( $content['hide_empty']['value'] ) || $content['hide_empty']['value'] !== 'no' ) {
        $content['hide_empty'] = [ 'value' => 'no' ];
        $changed = true;
    }
    if ( $changed ) {
        wp_update_post( [
            'ID'           => $post->ID,
            'post_content' => maybe_serialize( $content ),
        ] );
        $updated++;
        echo "Updated: {$post->post_title} (ID: {$post->ID})\n";
    }
}

global $wpdb;
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_wpc_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_wpc_%'" );

echo "\nDone. Updated {$updated} filter set(s). Cleared Filter Everything transients.\n";
