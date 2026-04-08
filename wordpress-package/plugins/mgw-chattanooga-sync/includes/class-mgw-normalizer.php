<?php
/**
 * MGW Normalizer — The "Traffic Controller"
 *
 * Maps any vendor CSV row to a standardized product structure.
 * Add Lipsey's or Zanders by creating a new JSON map file — no sync code changes.
 *
 * @package MGW_Chattanooga_Sync
 */
defined('ABSPATH') || exit;

class MGW_Normalizer {

    /**
     * Standard output keys. Importer expects these regardless of vendor.
     */
    const KEYS = [
        'sku', 'name', 'price', 'stock', 'brand', 'category_key', 'image_url', 'description', 'upc',
        'msrp', 'map', 'caliber', 'bullet_type', 'grain', 'round_count', 'capacity',
    ];

    /**
     * Normalize a raw CSV row to standard keys using a vendor map.
     *
     * @param array  $row          Raw associative array from CSV (headers as keys)
     * @param array  $vendor_map   Decoded JSON map: { "columns": { "sku": ["SKU","Item Number"], ... } }
     * @return array Standardized keys (see KEYS), including optional filter fields from CSV when present
     */
    public static function normalize(array $row, array $vendor_map) {
        $columns = isset($vendor_map['columns']) ? $vendor_map['columns'] : [];
        $out = [];
        foreach (self::KEYS as $key) {
            $candidates = isset($columns[$key]) ? (array) $columns[$key] : [$key];
            $value = '';
            foreach ($candidates as $col) {
                if (isset($row[$col]) && (string) $row[$col] !== '') {
                    $value = trim((string) $row[$col]);
                    break;
                }
            }
            $out[$key] = $value;
        }
        return $out;
    }

    /**
     * Load vendor map from JSON file.
     *
     * @param string $path Full path to map JSON (e.g. chattanooga-map.json)
     * @return array|null Decoded map or null on failure
     */
    public static function load_map($path) {
        if (!is_readable($path)) {
            return null;
        }
        $json = file_get_contents($path);
        $map = json_decode($json, true);
        return is_array($map) ? $map : null;
    }

    /**
     * Default Chattanooga column mapping (for backward compatibility).
     *
     * @return array
     */
    public static function get_chattanooga_map() {
        return [
            'columns' => [
                'sku'          => ['SKU', 'Item Number'],
                'name'         => ['Web Item Name', 'Item Name', 'Description'],
                'price'        => ['Price'],
                'stock'        => ['Quantity In Stock', 'Quantity Available'],
                'brand'        => ['Manufacturer'],
                'category_key' => ['Category'],
                'image_url'    => ['Image Location', 'Image URL', 'image_url'],
                'description'  => ['Web Item Description'],
                'upc'          => ['UPC'],
                'msrp'         => ['MSRP'],
                'map'          => ['MAP'],
                'caliber'      => ['Caliber'],
                'bullet_type'  => ['Bullet Type'],
                'grain'        => ['Grain'],
                'round_count'  => ['Rounds', 'Rounds Per Box', 'Round Count'],
                'capacity'     => ['Firearm Capacity', 'Magazine Capacity', 'Capacity'],
            ],
        ];
    }
}
