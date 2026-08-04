<?php
/**
 * Footer: newsletter CTA + link columns + bottom bar.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
</main>

<div class="container" style="margin: -1.5rem auto 3rem;">
  <div class="gm-newsletter">
    <div>
      <h2><?php esc_html_e( 'Odoberajte novinky', 'growmedica-sk' ); ?></h2>
      <p><?php esc_html_e( 'Nové produkty, akcie a odborné rady raz za čas na váš e-mail.', 'growmedica-sk' ); ?></p>
    </div>
    <form method="post" action="<?php echo esc_url( home_url( '/' ) ); ?>">
      <label class="screen-reader-text" for="gm-newsletter-email"><?php esc_html_e( 'E-mail', 'growmedica-sk' ); ?></label>
      <input type="email" id="gm-newsletter-email" name="email" placeholder="<?php esc_attr_e( 'Váš e-mail', 'growmedica-sk' ); ?>" required>
      <button type="submit" class="btn btn-primary"><?php esc_html_e( 'Odoberať', 'growmedica-sk' ); ?></button>
    </form>
  </div>
</div>

<footer class="gm-footer">
  <div class="container">
    <div class="gm-footer__brand">
      <a class="gm-footer__logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/logo-dark.svg' ); ?>" alt="<?php bloginfo( 'name' ); ?>">
      </a>
      <p><?php esc_html_e( 'Výživové doplnky a BIO potraviny pre zdravý životný štýl.', 'growmedica-sk' ); ?></p>
      <div class="gm-footer__social">
        <a href="#" aria-label="Facebook"><?php gm_icon( 'fb' ); ?></a>
        <a href="#" aria-label="Instagram"><?php gm_icon( 'ig' ); ?></a>
      </div>
    </div>

    <div>
      <h4><?php esc_html_e( 'Informácie pre vás', 'growmedica-sk' ); ?></h4>
      <ul>
        <li><a href="<?php echo esc_url( home_url( '/doprava-a-platba' ) ); ?>"><?php esc_html_e( 'Doprava a platba', 'growmedica-sk' ); ?></a></li>
        <li><a href="<?php echo esc_url( home_url( '/reklamacie' ) ); ?>"><?php esc_html_e( 'Reklamácie', 'growmedica-sk' ); ?></a></li>
        <li><a href="<?php echo esc_url( home_url( '/obchodne-podmienky' ) ); ?>"><?php esc_html_e( 'Obchodné podmienky', 'growmedica-sk' ); ?></a></li>
        <li><a href="<?php echo esc_url( home_url( '/ochrana-osobnych-udajov' ) ); ?>"><?php esc_html_e( 'Ochrana osobných údajov', 'growmedica-sk' ); ?></a></li>
      </ul>
    </div>

    <div>
      <h4><?php esc_html_e( 'O firme', 'growmedica-sk' ); ?></h4>
      <ul>
        <li><a href="<?php echo esc_url( home_url( '/o-nas' ) ); ?>"><?php esc_html_e( 'O nás', 'growmedica-sk' ); ?></a></li>
        <li><a href="<?php echo esc_url( home_url( '/blog' ) ); ?>"><?php esc_html_e( 'Blog', 'growmedica-sk' ); ?></a></li>
        <li><a href="<?php echo esc_url( home_url( '/kariera' ) ); ?>"><?php esc_html_e( 'Kariéra', 'growmedica-sk' ); ?></a></li>
      </ul>
    </div>

    <div>
      <h4><?php esc_html_e( 'Kontakt', 'growmedica-sk' ); ?></h4>
      <ul>
        <li><a href="tel:+421000000000">+421 000 000 000</a></li>
        <li><a href="mailto:info@growmedica.sk">info@growmedica.sk</a></li>
        <li><?php esc_html_e( 'Po–Pia 8:00–16:00', 'growmedica-sk' ); ?></li>
      </ul>
    </div>
  </div>

  <div class="gm-footer__bottom">
    <div class="container">
      <span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> GrowMedica.sk. <?php esc_html_e( 'Všetky práva vyhradené.', 'growmedica-sk' ); ?></span>
      <span>IČO: 00000000 &middot; DIČ: 0000000000</span>
    </div>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
