<?php
/**
 * Plugin Name: GrowMedica Clean Homepage
 * Description: Hides the empty WordPress blog ("Blog / nothing was found") on the CMS front page only. Shop, cart, checkout, admin and REST stay unchanged.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * True only for the posts index used as the site front page (/).
 * Does not match a dedicated posts page, shop, cart, or static front page.
 */
function growmedica_is_empty_blog_front_page(): bool
{
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
        return false;
    }

    if (defined('REST_REQUEST') && REST_REQUEST) {
        return false;
    }

    // Default WP: "Your latest posts" as homepage → is_front_page() && is_home().
    return is_front_page() && is_home();
}

/**
 * @return string Absolute storefront URL (no trailing slash).
 */
function growmedica_storefront_url(): string
{
    $from_env = getenv('GROWMEDICA_STOREFRONT_URL')
        ?: (defined('GROWMEDICA_STOREFRONT_URL') ? (string) GROWMEDICA_STOREFRONT_URL : '');
    if (is_string($from_env) && $from_env !== '') {
        return untrailingslashit($from_env);
    }

    return 'https://www.growmedica.cz';
}

add_action('template_redirect', static function (): void {
    if (!growmedica_is_empty_blog_front_page()) {
        return;
    }

    $shop = esc_url(growmedica_storefront_url());
    $admin = esc_url(admin_url());
    $site = esc_html(get_bloginfo('name') ?: 'GrowMedica CMS');
    $year = (int) gmdate('Y');

    status_header(200);
    nocache_headers();
    header('Content-Type: text/html; charset=UTF-8');

    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- values escaped above.
    echo <<<HTML
<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>{$site}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    background: #f6f7f9;
    color: #1a1d21;
    padding: 24px;
  }
  main {
    width: min(100%, 28rem);
    background: #fff;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    padding: 2rem 1.75rem;
    box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
    text-align: center;
  }
  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.35rem;
    letter-spacing: -0.02em;
  }
  p {
    margin: 0 0 1.25rem;
    color: #5b6470;
    line-height: 1.5;
    font-size: 0.95rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }
  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0 1rem;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }
  a.primary {
    background: #0f766e;
    color: #fff;
  }
  a.secondary {
    background: #eef1f4;
    color: #1a1d21;
  }
  footer {
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: #8a93a0;
  }
</style>
</head>
<body>
<main>
  <h1>{$site}</h1>
  <p>Headless CMS pre GrowMedica. Verejný e‑shop je na storefronte — tu je správa katalógu a pokladne.</p>
  <div class="actions">
    <a class="primary" href="{$shop}/">Otvoriť e‑shop</a>
    <a class="secondary" href="{$admin}">WP Admin</a>
  </div>
  <footer>© {$year} GrowMedica</footer>
</main>
</body>
</html>
HTML;

    exit;
}, 1);
