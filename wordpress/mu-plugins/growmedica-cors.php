<?php
/**
 * Plugin Name: GrowMedica CORS for Store API
 * Description: Allows Next.js storefront to call WooCommerce Store API from localhost and production.
 */

add_filter('woocommerce_rest_check_permissions', function ($permission) {
    return $permission;
}, 10, 1);

add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $allowed = [
            'http://localhost:5555',
            'http://127.0.0.1:5555',
            'https://growmedica.sk',
            'https://www.growmedica.sk',
        ];
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, $allowed, true) || str_ends_with($origin, '.vercel.app')) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Cart-Token, Nonce');
        }
        return $value;
    });
});
