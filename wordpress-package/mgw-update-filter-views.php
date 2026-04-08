<?php
/**
 * Update filter field views: In Stock = checkbox (labels), Price = range, all others = dropdown
 * Run: php mgw-update-filter-views.php (from wordpress root)
 */
$wp_load = '/opt/bitnami/wordpress/wp-load.php';
if ( ! file_exists( $wp_load ) ) {
    die( "WordPress not found.\n" );
}
define( 'WP_USE_THEMES', false );
require_once $wp_load;

if ( ! defined( 'FLRT_FILTERS_SET_POST_TYPE' ) ) {
    die( "Filter Everything plugin not active.\n" );
}

$fields = get_posts( [
    'post_type'   => 'filter-field',
    'post_status' => 'any',
    'numberposts' => -1,
] );

$updated = 0;
foreach ( $fields as $post ) {
    $data = maybe_unserialize( $post->post_content );
    if ( ! is_array( $data ) ) {
        continue;
    }
    $slug   = ! empty( $data['slug'] ) ? $data['slug'] : ( ! empty( $post->post_name ) ? $post->post_name : '' );
    $label  = ! empty( $data['label'] ) ? $data['label'] : ( ! empty( $post->post_title ) ? $post->post_title : $slug );
    $e_name = $data['e_name'] ?? '';
    $entity = $data['entity'] ?? '';
    if ( ! $slug && $e_name ) {
        $slug = str_replace( [ 'pa_', '_' ], [ '', '-' ], $e_name );
    }
    $changed = false;

    if ( $slug === 'in-stock' || ( $e_name === '_stock_status' && $entity === 'post_meta' ) ) {
        if ( ! in_array( $data['view'] ?? '', [ 'labels', 'checkboxes' ], true ) ) {
            $data['view'] = 'labels';
            $changed = true;
        } elseif ( ( $data['view'] ?? '' ) === 'checkboxes' ) {
            $data['view'] = 'labels';
            $changed = true;
        }
    } elseif ( $slug === 'price' || ( $entity === 'post_meta_num' && $e_name === '_price' ) ) {
        if ( ( $data['view'] ?? '' ) !== 'range' ) {
            $data['view'] = 'range';
            $changed = true;
        }
    } elseif ( $slug && $slug !== 'in-stock' && $slug !== 'price' ) {
        if ( ( $data['view'] ?? '' ) !== 'dropdown' ) {
            $data['view'] = 'dropdown';
            $changed = true;
        }
        $default_label = '- Select ' . $label . ' -';
        if ( ( $data['dropdown_label'] ?? '' ) !== $default_label ) {
            $data['dropdown_label'] = $default_label;
            $changed = true;
        }
    }

    if ( $changed ) {
        wp_update_post( [
            'ID'           => $post->ID,
            'post_content' => maybe_serialize( $data ),
        ] );
        $updated++;
        echo "Updated: {$post->post_title} (slug: {$slug}) → view: {$data['view']}\n";
    }
}

global $wpdb;
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_wpc_%'" );
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_wpc_%'" );

echo "\nDone. Updated {$updated} filter field(s). Cleared transients.\n";
