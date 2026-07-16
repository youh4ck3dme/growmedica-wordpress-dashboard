<?php
/**
 * Plugin Name: GrowMedica Checkout Seed
 * Description: Seeds WooCommerce session cart from ?gm_cart=id:qty,id:qty then redirects to checkout/cart.
 */
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Parse gm_cart payload into product_id => quantity pairs.
 *
 * @return array<int, int>
 */
function growmedica_parse_gm_cart(string $raw): array
{
    $items = [];
    foreach (array_filter(explode(',', $raw)) as $pair) {
        $parts = explode(':', $pair, 2);
        $product_id = absint($parts[0] ?? 0);
        $qty = max(1, min(99, absint($parts[1] ?? 1)));
        if ($product_id > 0) {
            $items[$product_id] = ($items[$product_id] ?? 0) + $qty;
            if ($items[$product_id] > 99) {
                $items[$product_id] = 99;
            }
        }
    }
    return $items;
}

add_action('template_redirect', function () {
    if (empty($_GET['gm_cart']) || !function_exists('WC')) {
        return;
    }

    if (null === WC()->cart) {
        if (function_exists('wc_load_cart')) {
            wc_load_cart();
        }
    }
    if (!WC()->cart) {
        return;
    }

    $raw = sanitize_text_field(wp_unslash((string) $_GET['gm_cart']));
    $items = growmedica_parse_gm_cart($raw);
    if ($items === []) {
        return;
    }

    WC()->cart->empty_cart();
    foreach ($items as $product_id => $qty) {
        WC()->cart->add_to_cart($product_id, $qty);
    }

    $to = isset($_GET['gm_to']) ? sanitize_key((string) $_GET['gm_to']) : 'checkout';
    $redirect = $to === 'cart' ? wc_get_cart_url() : wc_get_checkout_url();
    wp_safe_redirect($redirect);
    exit;
}, 5);
