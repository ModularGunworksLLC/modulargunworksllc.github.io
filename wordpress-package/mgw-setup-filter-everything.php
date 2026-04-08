<?php
/**
 * Run-once: Configure Filter Everything with Shop Filter Set
 *
 * Run via: wp eval-file /path/to/mgw-setup-filter-everything.php --path=/opt/bitnami/wordpress
 *
 * Creates a Filter Set for WooCommerce products with Brand, Caliber, Capacity,
 * Bullet Type, Grain, Price, and In Stock Only filters. After running, add the
 * "Filter Everything - Filters" widget to the Shop Sidebar (Appearance > Widgets).
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit( 'Run via: wp eval-file mgw-setup-filter-everything.php --path=/opt/bitnami/wordpress' );
}

function mgw_filter_everything_setup_run() {
    if ( ! function_exists( 'get_posts' ) ) {
        echo "WordPress not loaded.\n";
        return false;
    }
    if ( ! defined( 'FLRT_FILTERS_SET_POST_TYPE' ) ) {
        echo "Filter Everything plugin not active. Activate it first.\n";
        return false;
    }

    $existing = get_posts( [
        'post_type'    => 'filter-set',
        'post_status'  => 'publish',
        'numberposts'  => 1,
        'meta_query'   => [
            [ 'key' => 'wpc_filter_set_post_type', 'value' => 'product' ],
        ],
    ] );
    if ( ! empty( $existing ) ) {
        echo "Filter Set for products already exists (ID: {$existing[0]->ID}).\n";
        return (int) $existing[0]->ID;
    }

    $set_content = [
        'wp_page_type'    => 'common___common',
        'post_name'       => '1',
        'wp_filter_query' => '-1',
        'hide_empty'      => [ 'value' => 'yes' ],
        'show_count'      => [ 'value' => 'yes' ],
    ];

    $set_id = wp_insert_post( [
        'post_type'    => 'filter-set',
        'post_status'  => 'publish',
        'post_title'   => 'Shop Filters',
        'post_content' => maybe_serialize( $set_content ),
        'post_excerpt' => 'product',
        'post_name'    => '1',
        'menu_order'   => 0,
    ] );

    if ( is_wp_error( $set_id ) ) {
        echo "Failed to create Filter Set: " . $set_id->get_error_message() . "\n";
        return false;
    }

    update_post_meta( $set_id, 'wpc_filter_set_post_type', 'product' );

    $filters = [
        [ 'entity' => 'taxonomy', 'e_name' => 'pa_brand', 'label' => 'Brand', 'slug' => 'brand', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 1 ],
        [ 'entity' => 'taxonomy', 'e_name' => 'pa_caliber', 'label' => 'Caliber', 'slug' => 'caliber', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 2 ],
        [ 'entity' => 'taxonomy', 'e_name' => 'pa_capacity', 'label' => 'Capacity', 'slug' => 'capacity', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 3 ],
        [ 'entity' => 'taxonomy', 'e_name' => 'pa_bullet_type', 'label' => 'Bullet Type', 'slug' => 'bullet-type', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 4 ],
        [ 'entity' => 'taxonomy', 'e_name' => 'pa_grain_weight', 'label' => 'Grain', 'slug' => 'grain', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 5 ],
        [ 'entity' => 'post_meta_num', 'e_name' => '_price', 'label' => 'Price', 'slug' => 'price', 'view' => 'range', 'logic' => 'and', 'menu_order' => 6 ],
        [ 'entity' => 'post_meta', 'e_name' => '_stock_status', 'label' => 'In Stock Only', 'slug' => 'in-stock', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 7, 'exclude' => [ 'outofstock', 'onbackorder' ] ],
    ];

    foreach ( $filters as $f ) {
        $filter_data = [
            'entity'            => $f['entity'],
            'e_name'            => $f['e_name'],
            'label'             => $f['label'],
            'slug'              => $f['slug'],
            'view'              => $f['view'],
            'logic'             => $f['logic'],
            'in_path'           => 'no',
            'exclude'           => isset( $f['exclude'] ) ? $f['exclude'] : [],
            'parent_filter'     => 0,
            'hide_until_parent' => 'no',
            'hierarchy'         => 'no',
            'orderby'           => 'default',
        ];
        if ( $f['entity'] === 'post_meta_num' ) {
            $filter_data['min_num_label'] = 'Min';
            $filter_data['max_num_label'] = 'Max';
            $filter_data['step']          = 1;
        }

        $filter_id = wp_insert_post( [
            'post_type'    => 'filter-field',
            'post_status'  => 'publish',
            'post_title'   => $f['label'],
            'post_content' => maybe_serialize( $filter_data ),
            'post_name'    => $f['slug'],
            'post_parent'  => $set_id,
            'post_excerpt' => $f['entity'],
            'menu_order'   => $f['menu_order'],
        ] );

        if ( ! is_wp_error( $filter_id ) ) {
            echo "Created filter: {$f['label']} (ID: $filter_id)\n";
        }
    }

    echo "Filter Set created (ID: $set_id). Add 'Filter Everything - Filters' widget to Shop Sidebar (Appearance > Widgets).\n";
    return $set_id;
}

mgw_filter_everything_setup_run();
