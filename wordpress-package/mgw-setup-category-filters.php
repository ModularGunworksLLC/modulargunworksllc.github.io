<?php
/**
 * Run-once: Create category-specific Filter Everything Filter Sets
 *
 * Run via: wp eval-file /path/to/mgw-setup-category-filters.php --path=/opt/bitnami/wordpress
 *
 * Creates Filter Sets per product category with filters that make sense for each:
 * - Ammunition: In Stock, Firearm Type (Handgun/Rifle/Rimfire/Shotgun), Price, Brand, Caliber, Capacity, Bullet Type, Grain
 * - Magazines: In Stock, Firearm Type, Price, Brand, Capacity
 * - Firearms: In Stock, Firearm Type, Price, Brand
 * - Gun Parts: In Stock, Firearm Type, Price, Brand
 * - Gear, Optics, Reloading, Outdoors: In Stock, Price, Brand
 * - Default (Shop/other): In Stock, Price, Brand
 *
 * Stores category=>set_id mapping in option 'mgw_filter_set_ids' for wpc_relevant_set_ids.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit( 'Run via: wp eval-file mgw-setup-category-filters.php --path=/opt/bitnami/wordpress' );
}

function mgw_create_filter_set( $title, $filters ) {
    $set_content = [
        'wp_page_type'    => 'common___common',
        'post_name'       => '1',
        'wp_filter_query' => '-1',
        'hide_empty'      => [ 'value' => 'no' ], // 'no' = Never hide — keeps "In stock" visible even when cross_count is 0 (variable products)
        'show_count'      => [ 'value' => 'yes' ],
    ];

    $set_id = wp_insert_post( [
        'post_type'    => 'filter-set',
        'post_status'  => 'publish',
        'post_title'   => $title,
        'post_content' => maybe_serialize( $set_content ),
        'post_excerpt' => 'product',
        'post_name'    => '1',
        'menu_order'   => 0,
    ] );

    if ( is_wp_error( $set_id ) ) {
        echo "Failed to create {$title}: " . $set_id->get_error_message() . "\n";
        return false;
    }

    update_post_meta( $set_id, 'wpc_filter_set_post_type', 'product' );

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
        if ( isset( $f['view'] ) && $f['view'] === 'dropdown' ) {
            $filter_data['dropdown_label'] = isset( $f['dropdown_label'] ) ? $f['dropdown_label'] : '- Select ' . $f['label'] . ' -';
        }

        wp_insert_post( [
            'post_type'    => 'filter-field',
            'post_status'  => 'publish',
            'post_title'   => $f['label'],
            'post_content' => maybe_serialize( $filter_data ),
            'post_name'    => $f['slug'],
            'post_parent'  => $set_id,
            'post_excerpt' => $f['entity'],
            'menu_order'   => $f['menu_order'],
        ] );
    }

    return $set_id;
}

function mgw_setup_category_filters_run() {
    if ( ! function_exists( 'get_posts' ) ) {
        echo "WordPress not loaded.\n";
        return false;
    }
    if ( ! defined( 'FLRT_FILTERS_SET_POST_TYPE' ) ) {
        echo "Filter Everything plugin not active. Activate it first.\n";
        return false;
    }

    // In Stock = checkbox (labels); Price = range slider; all others = dropdown
    $base_filters = [
        [ 'entity' => 'post_meta', 'e_name' => '_stock_status', 'label' => 'In Stock Only', 'slug' => 'in-stock', 'view' => 'labels', 'logic' => 'and', 'menu_order' => 0, 'exclude' => [ 'outofstock', 'onbackorder' ] ],
    ];
    $product_cat_filter = [ 'entity' => 'taxonomy', 'e_name' => 'product_cat', 'label' => 'Type', 'slug' => 'firearm-type', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 1 ];
    $price_filter       = [ 'entity' => 'post_meta_num', 'e_name' => '_price', 'label' => 'Price', 'slug' => 'price', 'view' => 'range', 'logic' => 'and', 'menu_order' => 99 ];
    $brand_filter       = [ 'entity' => 'taxonomy', 'e_name' => 'pa_brand', 'label' => 'Brand', 'slug' => 'brand', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 10 ];
    $caliber_filter     = [ 'entity' => 'taxonomy', 'e_name' => 'pa_caliber', 'label' => 'Caliber', 'slug' => 'caliber', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 11 ];
    $capacity_filter    = [ 'entity' => 'taxonomy', 'e_name' => 'pa_capacity', 'label' => 'Capacity', 'slug' => 'capacity', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 12 ];
    $bullet_filter      = [ 'entity' => 'taxonomy', 'e_name' => 'pa_bullet_type', 'label' => 'Bullet Type', 'slug' => 'bullet-type', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 13 ];
    $grain_filter       = [ 'entity' => 'taxonomy', 'e_name' => 'pa_grain_weight', 'label' => 'Grain', 'slug' => 'grain', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 14 ];
    $on_sale_filter     = [ 'entity' => 'taxonomy', 'e_name' => 'product_visibility', 'label' => 'On Sale', 'slug' => 'on-sale', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 2 ];
    $steel_filter       = [ 'entity' => 'taxonomy', 'e_name' => 'pa_steel_case', 'label' => 'Steel Case', 'slug' => 'steel-case', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 15 ];
    $subsonic_filter    = [ 'entity' => 'taxonomy', 'e_name' => 'pa_subsonic', 'label' => 'Subsonic', 'slug' => 'subsonic', 'view' => 'dropdown', 'logic' => 'and', 'menu_order' => 16 ];

    $category_sets = [
        'ammunition' => [
            'title'   => 'Ammunition Filters',
            'filters' => array_merge( $base_filters, [
                $on_sale_filter,
                $product_cat_filter,
                $price_filter,
                $brand_filter,
                $caliber_filter,
                $capacity_filter,
                $bullet_filter,
                $grain_filter,
                $steel_filter,
                $subsonic_filter,
            ] ),
        ],
        'magazines' => [
            'title'   => 'Magazines Filters',
            'filters' => array_merge( $base_filters, [
                $product_cat_filter,
                $price_filter,
                $brand_filter,
                $capacity_filter,
            ] ),
        ],
        'firearms' => [
            'title'   => 'Firearms Filters',
            'filters' => array_merge( $base_filters, [
                $product_cat_filter,
                $price_filter,
                $brand_filter,
            ] ),
        ],
        'gun-parts' => [
            'title'   => 'Gun Parts Filters',
            'filters' => array_merge( $base_filters, [
                $product_cat_filter,
                $price_filter,
                $brand_filter,
            ] ),
        ],
        'default' => [
            'title'   => 'Shop Filters (Default)',
            'filters' => array_merge( $base_filters, [
                $on_sale_filter,
                $price_filter,
                $brand_filter,
            ] ),
        ],
    ];

    // Categories that use the default/minimal filter set
    $default_categories = [ 'gear', 'optics', 'reloading', 'outdoors', 'brands' ];

    $mapping = [];
    $created = [];
    $updated = [];

    foreach ( $category_sets as $slug => $config ) {
        $existing = get_posts( [
            'post_type'   => 'filter-set',
            'post_status' => 'publish',
            'numberposts' => 1,
            'title'       => $config['title'],
        ] );

        if ( ! empty( $existing ) ) {
            $set_id   = (int) $existing[0]->ID;
            $post     = $existing[0];
            $content  = $post->post_content;
            $decoded  = maybe_unserialize( $content );
            if ( is_array( $decoded ) && ( ! isset( $decoded['hide_empty']['value'] ) || $decoded['hide_empty']['value'] !== 'no' ) ) {
                $decoded['hide_empty'] = [ 'value' => 'no' ];
                wp_update_post( [ 'ID' => $set_id, 'post_content' => maybe_serialize( $decoded ) ] );
            }
            $updated[] = "{$config['title']} (ID: $set_id)";
        } else {
            $set_id = mgw_create_filter_set( $config['title'], $config['filters'] );
            if ( $set_id ) {
                $created[] = "{$config['title']} (ID: $set_id)";
            }
        }

        if ( $set_id ) {
            $mapping[ $slug ] = $set_id;
        }
    }

    foreach ( $default_categories as $cat_slug ) {
        $mapping[ $cat_slug ] = $mapping['default'];
    }

    update_option( 'mgw_filter_set_ids', $mapping, true );

    echo "Category filter sets configured.\n";
    if ( ! empty( $created ) ) {
        echo "Created: " . implode( ', ', $created ) . "\n";
    }
    if ( ! empty( $updated ) ) {
        echo "Existing (unchanged): " . implode( ', ', $updated ) . "\n";
    }
    echo "Mapping stored in option 'mgw_filter_set_ids'.\n";
    echo "Category-specific filtering is enabled via wpc_relevant_set_ids in functions.php.\n";

    return true;
}

mgw_setup_category_filters_run();
