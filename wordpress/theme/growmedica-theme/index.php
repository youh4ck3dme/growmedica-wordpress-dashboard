<?php
/**
 * Fallback template: blog listing / generic archive.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
get_header();
?>
<div class="container gm-page">
  <?php if ( have_posts() ) : ?>
    <?php while ( have_posts() ) : the_post(); ?>
      <article <?php post_class(); ?>>
        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <div class="entry-summary"><?php the_excerpt(); ?></div>
      </article>
      <hr>
    <?php endwhile; ?>
    <?php the_posts_pagination(); ?>
  <?php else : ?>
    <p><?php esc_html_e( 'Zatiaľ tu nie je žiadny obsah.', 'growmedica-sk' ); ?></p>
  <?php endif; ?>
</div>
<?php get_footer(); ?>
