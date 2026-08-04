<?php
/**
 * GrowMedica SK theme bootstrap.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'GM_THEME_VERSION', '1.0.0' );

function gm_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
    add_theme_support( 'automatic-feed-links' );
    add_theme_support( 'woocommerce' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'custom-logo', array(
        'height'      => 48,
        'width'       => 220,
        'flex-height' => true,
        'flex-width'  => true,
    ) );

    register_nav_menus( array(
        'primary' => __( 'Hlavné menu', 'growmedica-sk' ),
        'topbar'  => __( 'Horný panel', 'growmedica-sk' ),
        'footer'  => __( 'Pätička', 'growmedica-sk' ),
    ) );
}
add_action( 'after_setup_theme', 'gm_theme_setup' );

function gm_theme_assets() {
    wp_enqueue_style( 'gm-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap', array(), null );
    wp_enqueue_style( 'gm-style', get_stylesheet_uri(), array(), GM_THEME_VERSION );
}
add_action( 'wp_enqueue_scripts', 'gm_theme_assets' );

function gm_register_widget_areas() {
    register_sidebar( array(
        'name'          => __( 'Bočný panel', 'growmedica-sk' ),
        'id'            => 'sidebar-1',
        'before_widget' => '<div class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4>',
        'after_title'   => '</h4>',
    ) );
}
add_action( 'widgets_init', 'gm_register_widget_areas' );

/**
 * Generic supplement categories shown on the homepage.
 * Placeholder content only — replace with real WooCommerce product
 * categories once the catalog is live.
 */
function gm_placeholder_categories() {
    return array(
        array( 'label' => 'Vitamíny',        'icon' => 'sun' ),
        array( 'label' => 'Minerály',        'icon' => 'drop' ),
        array( 'label' => 'Bylinné kvapky',  'icon' => 'leaf' ),
        array( 'label' => 'Športová výživa', 'icon' => 'bolt' ),
        array( 'label' => 'Imunita',         'icon' => 'shield' ),
        array( 'label' => 'BIO potraviny',   'icon' => 'seed' ),
    );
}

/**
 * Small inline icon set so the theme has zero external icon dependencies.
 */
function gm_icon( $name ) {
    $icons = array(
        'sun'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
        'drop'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c4 5 7 8.5 7 12.5A7 7 0 0 1 5 14.5C5 10.5 8 7 12 2z"/></svg>',
        'leaf'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16z"/><path d="M4 20 12 12"/></svg>',
        'bolt'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
        'shield' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z"/></svg>',
        'seed'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="13" rx="5" ry="8"/><path d="M12 5V3"/></svg>',
        'truck'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="7" width="14" height="10"/><path d="M15 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',
        'chat'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.5"/></svg>',
        'check'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
        'search' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
        'user'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
        'cart'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
        'menu'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
        'ig'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
        'fb'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z"/></svg>',
    );
    echo $icons[ $name ] ?? '';
}
