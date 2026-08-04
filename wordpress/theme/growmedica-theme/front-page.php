<?php
/**
 * Homepage template.
 *
 * Section order mirrors a typical supplement e-shop layout:
 * hero -> USP strip -> category grid -> content -> newsletter (in footer.php).
 * All copy below is placeholder GrowMedica marketing text — replace via
 * the Customizer / page builder once real content is ready.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
get_header();
?>

<section class="gm-hero">
  <div class="container">
    <div>
      <h1><?php esc_html_e( 'Vitamíny, minerály a BIO potraviny pre váš zdravý životný štýl', 'growmedica-sk' ); ?></h1>
      <p><?php esc_html_e( 'Overené výživové doplnky a prírodné produkty na jednom mieste — s odborným poradenstvom a rýchlym doručením po celom Slovensku.', 'growmedica-sk' ); ?></p>
      <div class="gm-hero__actions">
        <a class="btn btn-primary" href="<?php echo esc_url( home_url( '/vitaminy' ) ); ?>"><?php esc_html_e( 'Nakupovať teraz', 'growmedica-sk' ); ?></a>
        <a class="btn btn-outline" href="<?php echo esc_url( home_url( '/o-nas' ) ); ?>"><?php esc_html_e( 'O GrowMedica', 'growmedica-sk' ); ?></a>
      </div>
    </div>
    <div class="gm-hero__visual" aria-hidden="true">
      <?php gm_icon( 'leaf' ); ?>
    </div>
  </div>
</section>

<section class="gm-usp">
  <div class="container">
    <div class="gm-usp-item">
      <span class="gm-usp-item__icon"><?php gm_icon( 'truck' ); ?></span>
      <div>
        <h3><?php esc_html_e( 'Rýchle doručenie', 'growmedica-sk' ); ?></h3>
        <p><?php esc_html_e( 'Odoslanie do 24 hodín, doprava zadarmo nad 39 €.', 'growmedica-sk' ); ?></p>
      </div>
    </div>
    <div class="gm-usp-item">
      <span class="gm-usp-item__icon"><?php gm_icon( 'chat' ); ?></span>
      <div>
        <h3><?php esc_html_e( 'Odborné poradenstvo', 'growmedica-sk' ); ?></h3>
        <p><?php esc_html_e( 'Poradíme s výberom podľa vašich potrieb.', 'growmedica-sk' ); ?></p>
      </div>
    </div>
    <div class="gm-usp-item">
      <span class="gm-usp-item__icon"><?php gm_icon( 'check' ); ?></span>
      <div>
        <h3><?php esc_html_e( 'Overená kvalita', 'growmedica-sk' ); ?></h3>
        <p><?php esc_html_e( 'Testované suroviny a transparentné zloženie.', 'growmedica-sk' ); ?></p>
      </div>
    </div>
    <div class="gm-usp-item">
      <span class="gm-usp-item__icon"><?php gm_icon( 'shield' ); ?></span>
      <div>
        <h3><?php esc_html_e( 'Bezpečný nákup', 'growmedica-sk' ); ?></h3>
        <p><?php esc_html_e( '30 dní na vrátenie, platba kartou aj na dobierku.', 'growmedica-sk' ); ?></p>
      </div>
    </div>
  </div>
</section>

<section class="gm-section">
  <div class="container">
    <div class="gm-section__head">
      <h2><?php esc_html_e( 'Nakupujte podľa kategórie', 'growmedica-sk' ); ?></h2>
      <p><?php esc_html_e( 'Prehľadne rozdelené produktové kategórie pre rýchly výber.', 'growmedica-sk' ); ?></p>
    </div>
    <div class="gm-cat-grid">
      <?php foreach ( gm_placeholder_categories() as $cat ) : ?>
        <a class="gm-cat-card" href="<?php echo esc_url( home_url( '/' . sanitize_title( $cat['label'] ) ) ); ?>">
          <span class="gm-cat-card__icon"><?php gm_icon( $cat['icon'] ); ?></span>
          <span><?php echo esc_html( $cat['label'] ); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php get_footer(); ?>
