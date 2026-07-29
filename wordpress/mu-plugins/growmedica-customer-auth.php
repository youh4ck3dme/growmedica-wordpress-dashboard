<?php
/**
 * Plugin Name: GrowMedica Customer Auth API
 * Description: Server-to-server login/register for the Next.js storefront (growmedica/v1/auth/*).
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shared secret for storefront → CMS auth calls.
 */
function growmedica_auth_shared_secret(): string
{
    $secret = getenv('GROWMEDICA_AUTH_SECRET')
        ?: (defined('GROWMEDICA_AUTH_SECRET') ? (string) GROWMEDICA_AUTH_SECRET : '')
        ?: (string) get_option('growmedica_auth_secret', '')
        ?: getenv('GROWMEDICA_REVALIDATION_SECRET')
        ?: (defined('GROWMEDICA_REVALIDATION_SECRET') ? (string) GROWMEDICA_REVALIDATION_SECRET : '')
        ?: (string) get_option('growmedica_revalidation_secret', '');

    return is_string($secret) ? trim($secret) : '';
}

/**
 * @return true|WP_Error
 */
function growmedica_auth_require_secret(WP_REST_Request $request)
{
    $expected = growmedica_auth_shared_secret();
    if ($expected === '' || strlen($expected) < 16) {
        return new WP_Error(
            'growmedica_auth_misconfigured',
            'Auth secret is not configured on CMS.',
            ['status' => 503]
        );
    }

    $provided = (string) $request->get_header('x-growmedica-auth-secret');
    if ($provided === '' || !hash_equals($expected, $provided)) {
        return new WP_Error(
            'growmedica_auth_forbidden',
            'Invalid auth secret.',
            ['status' => 401]
        );
    }

    return true;
}

/**
 * @param WP_User $user
 * @return array<string, mixed>
 */
function growmedica_auth_customer_payload(WP_User $user): array
{
    $customer_id = (int) $user->ID;
    $billing = [
        'first_name' => (string) get_user_meta($customer_id, 'billing_first_name', true),
        'last_name' => (string) get_user_meta($customer_id, 'billing_last_name', true),
        'company' => (string) get_user_meta($customer_id, 'billing_company', true),
        'address_1' => (string) get_user_meta($customer_id, 'billing_address_1', true),
        'address_2' => (string) get_user_meta($customer_id, 'billing_address_2', true),
        'city' => (string) get_user_meta($customer_id, 'billing_city', true),
        'postcode' => (string) get_user_meta($customer_id, 'billing_postcode', true),
        'country' => (string) get_user_meta($customer_id, 'billing_country', true),
        'phone' => (string) get_user_meta($customer_id, 'billing_phone', true),
        'email' => (string) get_user_meta($customer_id, 'billing_email', true),
    ];
    $shipping = [
        'first_name' => (string) get_user_meta($customer_id, 'shipping_first_name', true),
        'last_name' => (string) get_user_meta($customer_id, 'shipping_last_name', true),
        'company' => (string) get_user_meta($customer_id, 'shipping_company', true),
        'address_1' => (string) get_user_meta($customer_id, 'shipping_address_1', true),
        'address_2' => (string) get_user_meta($customer_id, 'shipping_address_2', true),
        'city' => (string) get_user_meta($customer_id, 'shipping_city', true),
        'postcode' => (string) get_user_meta($customer_id, 'shipping_postcode', true),
        'country' => (string) get_user_meta($customer_id, 'shipping_country', true),
    ];

    $display = trim($user->display_name);
    if ($display === '') {
        $display = trim($billing['first_name'] . ' ' . $billing['last_name']);
    }
    if ($display === '') {
        $display = (string) $user->user_email;
    }

    return [
        'customerId' => $customer_id,
        'email' => (string) $user->user_email,
        'name' => $display,
        'billing' => $billing,
        'shipping' => $shipping,
    ];
}

add_action('rest_api_init', function () {
    register_rest_route('growmedica/v1', '/auth/login', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $gate = growmedica_auth_require_secret($request);
            if (is_wp_error($gate)) {
                return $gate;
            }

            $params = $request->get_json_params();
            if (!is_array($params)) {
                $params = [];
            }

            $email = sanitize_email((string) ($params['email'] ?? ''));
            $password = (string) ($params['password'] ?? '');

            if ($email === '' || $password === '') {
                return new WP_Error(
                    'growmedica_auth_invalid',
                    'Email and password are required.',
                    ['status' => 400]
                );
            }

            $user = wp_authenticate($email, $password);
            if (is_wp_error($user)) {
                return new WP_Error(
                    'growmedica_auth_failed',
                    'Invalid email or password.',
                    ['status' => 401]
                );
            }

            if (!($user instanceof WP_User)) {
                return new WP_Error(
                    'growmedica_auth_failed',
                    'Invalid email or password.',
                    ['status' => 401]
                );
            }

            // Customers only (or shop managers / admins for support testing).
            $allowed = array_intersect($user->roles, ['customer', 'subscriber', 'administrator', 'shop_manager']);
            if ($allowed === []) {
                return new WP_Error(
                    'growmedica_auth_role',
                    'This account cannot sign in to the storefront.',
                    ['status' => 403]
                );
            }

            return rest_ensure_response(growmedica_auth_customer_payload($user));
        },
    ]);

    register_rest_route('growmedica/v1', '/auth/register', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $gate = growmedica_auth_require_secret($request);
            if (is_wp_error($gate)) {
                return $gate;
            }

            $params = $request->get_json_params();
            if (!is_array($params)) {
                $params = [];
            }

            $email = sanitize_email((string) ($params['email'] ?? ''));
            $password = (string) ($params['password'] ?? '');
            $first = sanitize_text_field((string) ($params['firstName'] ?? ''));
            $last = sanitize_text_field((string) ($params['lastName'] ?? ''));

            if ($email === '' || strlen($password) < 8) {
                return new WP_Error(
                    'growmedica_auth_invalid',
                    'Valid email and password (min 8 chars) are required.',
                    ['status' => 400]
                );
            }

            if (email_exists($email) || username_exists($email)) {
                return new WP_Error(
                    'growmedica_auth_exists',
                    'An account with this email already exists.',
                    ['status' => 409]
                );
            }

            $user_id = wp_create_user($email, $password, $email);
            if (is_wp_error($user_id)) {
                return $user_id;
            }

            $user = new WP_User((int) $user_id);
            $user->set_role('customer');

            if ($first !== '') {
                update_user_meta($user_id, 'first_name', $first);
                update_user_meta($user_id, 'billing_first_name', $first);
            }
            if ($last !== '') {
                update_user_meta($user_id, 'last_name', $last);
                update_user_meta($user_id, 'billing_last_name', $last);
            }
            update_user_meta($user_id, 'billing_email', $email);

            $display = trim($first . ' ' . $last);
            if ($display !== '') {
                wp_update_user([
                    'ID' => $user_id,
                    'display_name' => $display,
                ]);
                $user = new WP_User((int) $user_id);
            }

            return rest_ensure_response(growmedica_auth_customer_payload($user));
        },
    ]);

    register_rest_route('growmedica/v1', '/auth/me', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $gate = growmedica_auth_require_secret($request);
            if (is_wp_error($gate)) {
                return $gate;
            }

            $customer_id = absint($request->get_param('customerId'));
            if ($customer_id <= 0) {
                return new WP_Error(
                    'growmedica_auth_invalid',
                    'customerId is required.',
                    ['status' => 400]
                );
            }

            $user = get_user_by('id', $customer_id);
            if (!($user instanceof WP_User)) {
                return new WP_Error(
                    'growmedica_auth_not_found',
                    'Customer not found.',
                    ['status' => 404]
                );
            }

            return rest_ensure_response(growmedica_auth_customer_payload($user));
        },
    ]);
});
