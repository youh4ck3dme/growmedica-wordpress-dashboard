<?php
/**
 * Header: top bar + main navigation.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php $gm_img = get_template_directory_uri() . '/assets/images'; ?>
<link rel="icon" href="<?php echo esc_url( $gm_img . '/favicon.ico' ); ?>" sizes="any">
<link rel="icon" type="image/svg+xml" href="<?php echo esc_url( $gm_img . '/logo-icon.svg' ); ?>">
<link rel="icon" type="image/png" sizes="32x32" href="<?php echo esc_url( $gm_img . '/favicon-32.png' ); ?>">
<link rel="icon" type="image/png" sizes="192x192" href="<?php echo esc_url( $gm_img . '/favicon-192.png' ); ?>">
<link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url( $gm_img . '/favicon-180.png' ); ?>">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#gm-main"><?php esc_html_e( 'Preskočiť na obsah', 'growmedica-sk' ); ?></a>

<div class="gm-topbar">
  <div class="container">
    <span>Doprava zadarmo pri objednávke nad 39 &euro; &middot; SK / CZ</span>
    <ul class="gm-topbar__links">
      <li><a href="tel:+421000000000">+421 000 000 000</a></li>
      <li><a href="<?php echo esc_url( home_url( '/kontakty' ) ); ?>"><?php esc_html_e( 'Kontakty', 'growmedica-sk' ); ?></a></li>
    </ul>
  </div>
</div>

<header class="gm-header">
  <div class="container">
    <a class="gm-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
      <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo.svg' ); ?>" alt="<?php bloginfo( 'name' ); ?>">
    </a>

    <?php
    wp_nav_menu( array(
        'theme_location' => 'primary',
        'container'      => false,
        'menu_class'     => 'gm-nav',
        'fallback_cb'    => 'gm_default_primary_menu',
    ) );
    ?>

    <div class="gm-header__actions">
      <button class="gm-icon-btn" type="button" aria-label="<?php esc_attr_e( 'Hľadať', 'growmedica-sk' ); ?>"><?php gm_icon( 'search' ); ?></button>
      <a class="gm-icon-btn" href="<?php echo esc_url( home_url( '/moj-ucet' ) ); ?>" aria-label="<?php esc_attr_e( 'Môj účet', 'growmedica-sk' ); ?>"><?php gm_icon( 'user' ); ?></a>
      <a class="gm-icon-btn" href="<?php echo esc_url( home_url( '/kosik' ) ); ?>" aria-label="<?php esc_attr_e( 'Košík', 'growmedica-sk' ); ?>"><?php gm_icon( 'cart' ); ?></a>
      <button class="gm-icon-btn gm-nav-toggle" type="button" aria-label="<?php esc_attr_e( 'Menu', 'growmedica-sk' ); ?>"><?php gm_icon( 'menu' ); ?></button>
    </div>
  </div>
</header>

<?php
function gm_default_primary_menu() {
    $items = array(
        home_url( '/' )               => 'Úvod',
        home_url( '/vitaminy' )       => 'Vitamíny',
        home_url( '/mineraly' )       => 'Minerály',
        home_url( '/bylinne-kvapky' ) => 'Bylinné kvapky',
        home_url( '/blog' )           => 'Blog',
        home_url( '/o-nas' )          => 'O nás',
    );
    echo '<ul class="gm-nav">';
    foreach ( $items as $url => $label ) {
        printf( '<li><a href="%s">%s</a></li>', esc_url( $url ), esc_html( $label ) );
    }
    echo '</ul>';
}
?>

<main id="gm-main">
