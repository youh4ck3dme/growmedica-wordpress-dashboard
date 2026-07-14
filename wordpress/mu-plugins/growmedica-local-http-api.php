<?php
/**
 * Local dev: allow WooCommerce REST consumer key/secret over HTTP (localhost only).
 */
add_filter('determine_current_user', function ($user_id) {
    if ($user_id || is_ssl()) {
        return $user_id;
    }

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $is_local = str_contains($host, 'localhost') || str_contains($host, '127.0.0.1');
    if (!$is_local) {
        return $user_id;
    }

    $consumer_key = $_GET['consumer_key'] ?? $_SERVER['PHP_AUTH_USER'] ?? '';
    $consumer_secret = $_GET['consumer_secret'] ?? $_SERVER['PHP_AUTH_PW'] ?? '';

    if (!$consumer_key || !$consumer_secret || !function_exists('wc_api_hash')) {
        return $user_id;
    }

    global $wpdb;
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT user_id, consumer_secret FROM {$wpdb->prefix}woocommerce_api_keys WHERE consumer_key = %s",
            wc_api_hash(sanitize_text_field($consumer_key))
        )
    );

    if (!$row || !hash_equals($row->consumer_secret, $consumer_secret)) {
        return $user_id;
    }

    return (int) $row->user_id;
}, 20);