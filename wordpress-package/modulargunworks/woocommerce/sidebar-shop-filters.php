<?php
/**
 * Shop Filters - Industry standard (Ammo Depot, PSA, AmmoSeek)
 * Ammo: Type (Handgun/Rifle/Rimfire/Shotgun), Caliber, Bullet Type, Grain Weight, Brand, Price
 * Magazines: Caliber, Capacity
 * Instant apply on change, Clear All, result count
 */
defined('ABSPATH') || exit;

$current_cat = is_product_category() ? get_queried_object() : null;
$current_brand = is_tax('pa_brand') ? get_queried_object() : null;
if ( ! $current_cat && ! empty( $_GET['product_cat'] ) ) {
	$maybe_cat = get_term_by( 'slug', sanitize_text_field( wp_unslash( $_GET['product_cat'] ) ), 'product_cat' );
	if ( $maybe_cat && ! is_wp_error( $maybe_cat ) ) {
		$current_cat = $maybe_cat;
	}
}
if ( ! $current_brand && ! empty( $_GET['product_brand'] ) && taxonomy_exists( 'pa_brand' ) ) {
	$maybe_br = get_term_by( 'slug', sanitize_text_field( wp_unslash( $_GET['product_brand'] ) ), 'pa_brand' );
	if ( $maybe_br && ! is_wp_error( $maybe_br ) ) {
		$current_brand = $maybe_br;
	}
}

if ($current_brand) {
    $current_url = get_term_link($current_brand);
} elseif ($current_cat) {
    $current_url = get_term_link($current_cat);
} else {
    $current_url = get_permalink(wc_get_page_id('shop'));
}
$current_url = is_string($current_url) ? $current_url : home_url('/shop/');

// Current filter values
$min_price = isset($_GET['min_price']) ? floatval($_GET['min_price']) : '';
$max_price = isset($_GET['max_price']) ? floatval($_GET['max_price']) : '';
$filter_brand_raw = isset($_GET['filter_pa_brand']) ? sanitize_text_field($_GET['filter_pa_brand']) : '';
$filter_brand = $filter_brand_raw ? array_map('trim', explode(',', $filter_brand_raw)) : [];
$filter_caliber_raw = isset($_GET['filter_pa_caliber']) ? sanitize_text_field($_GET['filter_pa_caliber']) : '';
$filter_caliber = $filter_caliber_raw ? array_map('trim', explode(',', $filter_caliber_raw)) : [];
$filter_bullet_raw = isset($_GET['filter_pa_bullet_type']) ? sanitize_text_field($_GET['filter_pa_bullet_type']) : '';
$filter_bullet = $filter_bullet_raw ? array_map('trim', explode(',', $filter_bullet_raw)) : [];
$filter_grain_raw = isset($_GET['filter_pa_grain_weight']) ? sanitize_text_field($_GET['filter_pa_grain_weight']) : '';
$filter_grain = $filter_grain_raw ? array_map('trim', explode(',', $filter_grain_raw)) : [];
$filter_capacity_raw = isset($_GET['filter_pa_capacity']) ? sanitize_text_field($_GET['filter_pa_capacity']) : '';
$filter_capacity = $filter_capacity_raw ? array_map('trim', explode(',', $filter_capacity_raw)) : [];
$filter_stock = isset($_GET['filter_stock']) ? sanitize_text_field($_GET['filter_stock']) : '';
$orderby = isset($_GET['orderby']) ? sanitize_text_field($_GET['orderby']) : '';
$s = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';

$cat_slug = $current_cat ? strtolower($current_cat->slug) : '';
// Ammo filters: show in ammunition category OR any subcategory of ammunition
$ammo_term_id = 0;
if (taxonomy_exists('product_cat')) {
    $ammo_terms = get_terms(['taxonomy' => 'product_cat', 'slug' => 'ammunition', 'hide_empty' => false]);
    if (!is_wp_error($ammo_terms) && !empty($ammo_terms)) {
        $ammo_term_id = (int) $ammo_terms[0]->term_id;
    }
}
$is_ammo = ($cat_slug === 'ammunition') || ($current_cat && $ammo_term_id && term_is_ancestor_of($ammo_term_id, $current_cat->term_id, 'product_cat'));
$mag_parent_id = 0;
if (taxonomy_exists('product_cat')) {
    $mag_terms = get_terms(['taxonomy' => 'product_cat', 'slug' => 'magazines', 'hide_empty' => false]);
    if (!is_wp_error($mag_terms) && !empty($mag_terms)) {
        $mag_parent_id = (int) $mag_terms[0]->term_id;
    }
}
$is_magazines = ($cat_slug === 'magazines') || ($current_cat && $mag_parent_id && term_is_ancestor_of($mag_parent_id, $current_cat->term_id, 'product_cat'));
$firearms_term_id = 0;
$gun_parts_term_id = 0;
if (taxonomy_exists('product_cat')) {
    $ft = get_term_by('slug', 'firearms', 'product_cat');
    $gp = get_term_by('slug', 'gun-parts', 'product_cat');
    if ($ft && !is_wp_error($ft)) $firearms_term_id = (int) $ft->term_id;
    if ($gp && !is_wp_error($gp)) $gun_parts_term_id = (int) $gp->term_id;
}
// Show ammo filters on all shop/category pages (Ammo Depot–style: always show full filter set)
$show_ammo_filters = true;

// Attribute filter options
$brands = [];
$calibers = [];
$bullet_types = [];
$grain_weights = [];
$capacities = [];

if (taxonomy_exists('pa_brand')) {
    $t = get_terms(['taxonomy' => 'pa_brand', 'hide_empty' => true]);
    if (!is_wp_error($t)) { foreach ($t as $x) { $brands[$x->slug] = $x->name; } asort($brands); }
}
if (taxonomy_exists('pa_caliber')) {
    $t = get_terms(['taxonomy' => 'pa_caliber', 'hide_empty' => true]);
    if (!is_wp_error($t)) { foreach ($t as $x) { $calibers[$x->slug] = $x->name; } asort($calibers); }
}
if (taxonomy_exists('pa_bullet_type')) {
    $t = get_terms(['taxonomy' => 'pa_bullet_type', 'hide_empty' => true]);
    if (!is_wp_error($t)) { foreach ($t as $x) { $bullet_types[$x->slug] = $x->name; } asort($bullet_types); }
}
if (taxonomy_exists('pa_grain_weight')) {
    $t = get_terms(['taxonomy' => 'pa_grain_weight', 'hide_empty' => true]);
    if (!is_wp_error($t)) { foreach ($t as $x) { $grain_weights[$x->slug] = $x->name; } asort($grain_weights); }
}
if (taxonomy_exists('pa_capacity')) {
    $t = get_terms(['taxonomy' => 'pa_capacity', 'hide_empty' => true]);
    if (!is_wp_error($t)) { foreach ($t as $x) { $capacities[$x->slug] = $x->name; } asort($capacities); }
}

// Subcategories: show type filters for Ammunition, Magazines, Firearms, Gun Parts (PSA/Ammo Depot style)
$subcats = [];
if ($current_cat) {
    $parent_id = (int) $current_cat->term_id;
    $hide_empty = true;
    if ($ammo_term_id && ($parent_id === $ammo_term_id || term_is_ancestor_of($ammo_term_id, $parent_id, 'product_cat'))) {
        $hide_empty = false;
        $parent_id = $ammo_term_id;
    } elseif ($mag_parent_id && ($parent_id === $mag_parent_id || term_is_ancestor_of($mag_parent_id, $parent_id, 'product_cat'))) {
        $hide_empty = false;
        $parent_id = $mag_parent_id;
    } elseif ($firearms_term_id && ($parent_id === $firearms_term_id || term_is_ancestor_of($firearms_term_id, $parent_id, 'product_cat'))) {
        $hide_empty = false;
        $parent_id = $firearms_term_id;
    } elseif ($gun_parts_term_id && ($parent_id === $gun_parts_term_id || term_is_ancestor_of($gun_parts_term_id, $parent_id, 'product_cat'))) {
        $hide_empty = false;
        $parent_id = $gun_parts_term_id;
    }
    $subcats = get_terms(['taxonomy' => 'product_cat', 'parent' => $parent_id, 'hide_empty' => $hide_empty]);
} else {
    $subcats = get_terms(['taxonomy' => 'product_cat', 'parent' => 0, 'hide_empty' => true, 'exclude' => [get_option('default_product_cat')]]);
}
if (is_wp_error($subcats)) $subcats = [];

// Category filter label (industry terms: PSA, Ammo Depot)
if ($ammo_term_id && ($current_cat && ($current_cat->term_id === $ammo_term_id || term_is_ancestor_of($ammo_term_id, $current_cat->term_id, 'product_cat')))) {
    $filter_type_label = __('Ammo Type', 'modulargunworks');
} elseif ($mag_parent_id && ($current_cat && ($current_cat->term_id === $mag_parent_id || term_is_ancestor_of($mag_parent_id, $current_cat->term_id, 'product_cat')))) {
    $filter_type_label = __('Magazine Type', 'modulargunworks');
} elseif ($firearms_term_id && ($current_cat && ($current_cat->term_id === $firearms_term_id || term_is_ancestor_of($firearms_term_id, $current_cat->term_id, 'product_cat')))) {
    $filter_type_label = __('Firearm Type', 'modulargunworks');
} elseif ($gun_parts_term_id && ($current_cat && ($current_cat->term_id === $gun_parts_term_id || term_is_ancestor_of($gun_parts_term_id, $current_cat->term_id, 'product_cat')))) {
    $filter_type_label = __('Part Type', 'modulargunworks');
} else {
    $filter_type_label = __('Category', 'modulargunworks');
}

// Active filter count for "Clear filters" UX
$active_filter_count = 0;
if ($filter_stock === 'instock') $active_filter_count++;
if (!empty($filter_brand)) $active_filter_count += count($filter_brand);
if (!empty($filter_caliber)) $active_filter_count += count($filter_caliber);
if (!empty($filter_bullet)) $active_filter_count += count($filter_bullet);
if (!empty($filter_grain)) $active_filter_count += count($filter_grain);
if (!empty($filter_capacity)) $active_filter_count += count($filter_capacity);
if ($min_price !== '' || $max_price !== '') $active_filter_count++;

function mgw_filter_checklist($items, $param_name, $selected, $placeholder, $list_id, $checkbox_class) {
    if (empty($items)) return;
    static $hidden_output = [];
    $hidden_id = 'filter_' . str_replace(['filter_pa_', 'pa_'], '', $param_name);
    if (empty($hidden_output[$param_name])) {
        $hidden_output[$param_name] = true;
        ?><input type="hidden" name="<?php echo esc_attr($param_name); ?>" id="<?php echo esc_attr($hidden_id); ?>" value="<?php echo esc_attr(implode(',', $selected)); ?>"><?php
    }
    ?>
    <input type="text" class="filter-search filter-search-within" placeholder="<?php echo esc_attr($placeholder); ?>" data-filter-target="<?php echo esc_attr($list_id); ?>">
    <div id="<?php echo esc_attr($list_id); ?>" class="filter-checklist">
        <?php foreach ($items as $slug => $name) : ?>
        <label class="filter-option">
            <input type="checkbox" value="<?php echo esc_attr($slug); ?>" data-filter-param="<?php echo esc_attr($param_name); ?>" <?php checked(in_array($slug, $selected)); ?>>
            <span><?php echo esc_html($name); ?></span>
        </label>
        <?php endforeach; ?>
    </div>
    <?php
}
?>
<aside id="filters-sidebar" class="mgw-shop-sidebar mgw-shop-filters">
  <div class="filter-header">
    <h3><?php esc_html_e('FILTERS', 'modulargunworks'); ?></h3>
    <a href="<?php echo esc_url($current_brand ? get_term_link($current_brand) : ($current_cat ? get_term_link($current_cat) : $current_url)); ?>" class="clear-filters-link clear-filters-red" id="clear-filters">
      <?php esc_html_e('CLEAR ALL', 'modulargunworks'); ?>
      <?php if ($active_filter_count > 0) : ?>
        <span class="filter-active-count">(<?php echo (int) $active_filter_count; ?>)</span>
      <?php endif; ?>
    </a>
  </div>

  <div class="mgw-filter-scroll-wrapper">
  <form method="get" class="mgw-filter-form" action="<?php echo esc_url($current_url); ?>" id="mgw-filter-form">
    <?php if ( ! $current_cat && ! $current_brand ) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
    <?php if ($s) : ?><input type="hidden" name="s" value="<?php echo esc_attr($s); ?>"><?php endif; ?>
    <div class="filter-stock-top">
      <label class="filter-label filter-stock-label">
        <input type="checkbox" name="filter_stock" value="instock" <?php checked($filter_stock === 'instock'); ?>>
        <?php esc_html_e('Show Only In Stock', 'modulargunworks'); ?>
      </label>
    </div>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-category">
        <span><?php echo esc_html($filter_type_label); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-category" class="filter-content active">
        <div class="filter-checklist">
          <?php if (!empty($subcats)) : foreach ($subcats as $cat) :
              $cat_url = get_term_link($cat);
              $is_current = $current_cat && $current_cat->term_id === $cat->term_id;
          ?>
          <a href="<?php echo esc_url($cat_url); ?>" class="filter-option <?php echo $is_current ? 'current' : ''; ?>">
            <?php echo esc_html($cat->name); ?> (<?php echo esc_html($cat->count); ?>)
          </a>
          <?php endforeach; else : ?>
          <span class="filter-empty"><?php esc_html_e('No subcategories', 'modulargunworks'); ?></span>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-caliber">
        <span><?php esc_html_e('Caliber', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-caliber" class="filter-content active">
        <?php if (!empty($calibers)) : mgw_filter_checklist($calibers, 'filter_pa_caliber', $filter_caliber, __('Search (9mm, .308, ...)', 'modulargunworks'), 'filter-caliber-list', 'caliber-checkbox'); else : ?>
        <span class="filter-empty"><?php esc_html_e('No options available', 'modulargunworks'); ?></span>
        <?php endif; ?>
      </div>
    </div>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-bullet">
        <span><?php esc_html_e('Bullet Type', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-bullet" class="filter-content active">
        <?php if (!empty($bullet_types)) : mgw_filter_checklist($bullet_types, 'filter_pa_bullet_type', $filter_bullet, __('Search (FMJ, JHP, ...)', 'modulargunworks'), 'filter-bullet-list', 'bullet-checkbox'); else : ?>
        <span class="filter-empty"><?php esc_html_e('No options available', 'modulargunworks'); ?></span>
        <?php endif; ?>
      </div>
    </div>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-grain">
        <span><?php esc_html_e('Grain Weight', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-grain" class="filter-content active">
        <?php if (!empty($grain_weights)) : mgw_filter_checklist($grain_weights, 'filter_pa_grain_weight', $filter_grain, __('Search (55gr, 168gr, ...)', 'modulargunworks'), 'filter-grain-list', 'grain-checkbox'); else : ?>
        <span class="filter-empty"><?php esc_html_e('No options available', 'modulargunworks'); ?></span>
        <?php endif; ?>
      </div>
    </div>

    <?php if ($is_magazines && !empty($capacities)) : ?>
    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-capacity">
        <span><?php esc_html_e('Capacity', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-capacity" class="filter-content active">
        <?php mgw_filter_checklist($capacities, 'filter_pa_capacity', $filter_capacity, __('Search (10rd, 30rd, ...)', 'modulargunworks'), 'filter-capacity-list', 'capacity-checkbox'); ?>
      </div>
    </div>
    <?php endif; ?>

    <?php if ($is_magazines && !empty($calibers)) : ?>
    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-caliber-mag">
        <span><?php esc_html_e('Caliber', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-caliber-mag" class="filter-content active">
        <?php mgw_filter_checklist($calibers, 'filter_pa_caliber', $filter_caliber, __('Search (9mm, .45, ...)', 'modulargunworks'), 'filter-caliber-mag-list', 'caliber-checkbox'); ?>
      </div>
    </div>
    <?php endif; ?>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-price">
        <span><?php esc_html_e('Price', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-price" class="filter-content active">
        <div class="price-filter-inputs">
          <input type="number" name="min_price" id="price-min" value="<?php echo esc_attr($min_price); ?>" placeholder="$0" min="0" step="0.01">
          <input type="number" name="max_price" id="price-max" value="<?php echo esc_attr($max_price); ?>" placeholder="$999" min="0" step="0.01">
        </div>
      </div>
    </div>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-brand">
        <span><?php esc_html_e('Brand', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-brand" class="filter-content active">
        <?php if (!empty($brands)) : mgw_filter_checklist($brands, 'filter_pa_brand', $filter_brand, __('Search (Federal, Winchester, ...)', 'modulargunworks'), 'filter-brand-list', 'brand-checkbox'); else : ?>
        <span class="filter-empty"><?php esc_html_e('No options available', 'modulargunworks'); ?></span>
        <?php endif; ?>
      </div>
    </div>

    <div class="filter-section">
      <button type="button" class="filter-toggle active" aria-expanded="true" aria-controls="filter-sort">
        <span><?php esc_html_e('Sort By', 'modulargunworks'); ?></span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div id="filter-sort" class="filter-content active">
        <select name="orderby" class="filter-sort-select">
          <option value=""><?php esc_html_e('Default', 'modulargunworks'); ?></option>
          <option value="price" <?php selected($orderby, 'price'); ?>><?php esc_html_e('Price Per Round: Low to High', 'modulargunworks'); ?></option>
          <option value="price-desc" <?php selected($orderby, 'price-desc'); ?>><?php esc_html_e('Price: High to Low', 'modulargunworks'); ?></option>
          <option value="popularity" <?php selected($orderby, 'popularity'); ?>><?php esc_html_e('Best Sellers', 'modulargunworks'); ?></option>
          <option value="date" <?php selected($orderby, 'date'); ?>><?php esc_html_e('Newest', 'modulargunworks'); ?></option>
        </select>
      </div>
    </div>
  </form>

  </div><!-- .mgw-filter-scroll-wrapper -->
</aside>
