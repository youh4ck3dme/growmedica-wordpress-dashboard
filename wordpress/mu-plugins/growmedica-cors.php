<?php
/**
 * Plugin Name: GrowMedica CORS for Store API
 * Description: Allows Next.js storefront to call WooCommerce Store API from allowlisted origins.
 */

add_filter('woocommerce_rest_check_permissions', function ($permission) {
    return $permission;
}, 10, 1);

/**
 * Exact allowlist — never open *.vercel.app with credentials.
 *
 * @return list<string>
 */
function growmedica_cors_allowed_origins(): array
{
    $origins = [
        'http://localhost:5555',
        'http://127.0.0.1:5555',
        'https://growmedica.cz',
        'https://www.growmedica.cz',
    ];

    $extra = getenv('GROWMEDICA_CORS_ORIGINS')
        ?: (defined('GROWMEDICA_CORS_ORIGINS') ? GROWMEDICA_CORS_ORIGINS : '');
    if (is_string($extra) && $extra !== '') {
        foreach (array_map('trim', explode(',', $extra)) as $origin) {
            if ($origin !== '' && !in_array($origin, $origins, true)) {
                $origins[] = $origin;
            }
        }
    }

    return $origins;
}

add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = growmedica_cors_allowed_origins();

        if ($origin !== '' && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Cart-Token, Nonce');
            header('Vary: Origin');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            status_header(204);
            exit;
        }

        return $value;
    });
});
