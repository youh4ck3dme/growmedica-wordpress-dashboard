<?php
/**
 * Plugin Name: GrowMedica ISR Revalidation
 * Description: Notifies the Next.js storefront to revalidate WooCommerce cache tags on product/category save.
 */
if (!defined('ABSPATH')) {
    exit;
}

function growmedica_revalidate_config(): array
{
    $secret = getenv('GROWMEDICA_REVALIDATION_SECRET')
        ?: (defined('GROWMEDICA_REVALIDATION_SECRET') ? GROWMEDICA_REVALIDATION_SECRET : '')
        ?: (string) get_option('growmedica_revalidation_secret', '');
    $storefront = getenv('GROWMEDICA_STOREFRONT_URL')
        ?: (defined('GROWMEDICA_STOREFRONT_URL') ? GROWMEDICA_STOREFRONT_URL : '')
        ?: (string) get_option('growmedica_storefront_url', 'https://www.growmedica.cz');
    return ['secret' => $secret, 'storefront' => $storefront];
}

function growmedica_revalidate_storefront(string $tag): void
{
    $cfg = growmedica_revalidate_config();
    if ($cfg['secret'] === '' || $cfg['storefront'] === '') {
        return;
    }
    // Secret goes in header only — never in query string (access/proxy logs).
    $url = rtrim($cfg['storefront'], '/') . '/api/revalidate';
    wp_remote_post($url, [
        'timeout' => 10,
        'blocking' => false,
        'headers' => [
            'Content-Type' => 'application/json',
            'x-revalidation-secret' => $cfg['secret'],
        ],
        'body' => wp_json_encode(['tag' => $tag]),
    ]);
}

function growmedica_revalidate_product(int $product_id): void
{
    $product = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
    if (!$product) {
        return;
    }
    $slug = $product->get_slug();
    if ($slug) {
        growmedica_revalidate_storefront('woo-product-' . $slug);
    }
    growmedica_revalidate_storefront('woo-products');
}

function growmedica_revalidate_category(int $term_id): void
{
    $term = get_term($term_id, 'product_cat');
    if (!$term || is_wp_error($term)) {
        return;
    }
    if (!empty($term->slug)) {
        growmedica_revalidate_storefront('woo-category-' . $term->slug);
    }
    growmedica_revalidate_storefront('woo-categories');
}

add_action('save_post_product', function (int $post_id) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    growmedica_revalidate_product($post_id);
}, 20);

add_action('edited_product_cat', 'growmedica_revalidate_category', 20);
add_action('created_product_cat', 'growmedica_revalidate_category', 20);
