#!/usr/bin/env bash
# Nastaví produkčný WordPress na cms.growmedica.cz cez WebSupport shell.
# NEprepína Vercel shop na WordPress — len hardening + voliteľne Woo.
#
# Usage:
#   export WEBSUPPORT_SSH_PASS='…'
#   export WEBSUPPORT_SSH_PORT=29267   # z panelu Shell (dočasný)
#   ./scripts/setup-cms-production.sh
#   ./scripts/setup-cms-production.sh --with-woo   # nainštaluje WooCommerce

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_HOST="${WEBSUPPORT_SSH_HOST:-shell.r1.websupport.sk}"
SSH_USER="${WEBSUPPORT_SSH_USER:-uid6438887}"
SSH_PORT="${WEBSUPPORT_SSH_PORT:-29267}"
SSH_PASS="${WEBSUPPORT_SSH_PASS:-}"
WP_PATH="growmedica.cz/sub/cms"
WITH_WOO=0

for arg in "$@"; do
  case "$arg" in
    --with-woo) WITH_WOO=1 ;;
  esac
done

if [[ -z "$SSH_PASS" ]]; then
  echo "ERROR: nastav WEBSUPPORT_SSH_PASS (heslo z WebSupport → Shell, platné ~60 min)"
  exit 1
fi

if ! command -v expect >/dev/null; then
  echo "ERROR: need expect"
  exit 1
fi

REMOTE_SCRIPT=$(cat <<'REMOTE'
set -e
WP=growmedica.cz/sub/cms
echo "=== WP core ==="
wp --path="$WP" core is-installed
wp --path="$WP" core version
wp --path="$WP" option update siteurl 'https://cms.growmedica.cz'
wp --path="$WP" option update home 'https://cms.growmedica.cz'
wp --path="$WP" option update blogname 'GrowMedica CMS'
wp --path="$WP" option update blogdescription 'Headless CMS — shop je www.growmedica.cz'
wp --path="$WP" option update blog_public 0
wp --path="$WP" option update timezone_string 'Europe/Prague'
wp --path="$WP" option update WPLANG 'sk_SK' || true
wp --path="$WP" rewrite structure '/%postname%/' --hard || true
wp --path="$WP" rewrite flush --hard || true

# Remove junk plugins
wp --path="$WP" plugin delete hello 2>/dev/null || true
wp --path="$WP" plugin activate akismet 2>/dev/null || true

# Ensure root web empty marker (do not install WP on apex)
mkdir -p growmedica.cz/web
if [[ ! -f growmedica.cz/web/index.html ]]; then
  cat > growmedica.cz/web/index.html <<'HTML'
<!DOCTYPE html><html><head><meta charset="utf-8"><title>growmedica.cz</title>
<meta http-equiv="refresh" content="0;url=https://www.growmedica.cz/"></head>
<body><p>E-shop: <a href="https://www.growmedica.cz/">www.growmedica.cz</a></p></body></html>
HTML
fi

mkdir -p "$WP/wp-content/mu-plugins"

# Clean empty blog homepage on CMS front only (no "Blog / nothing was found")
cat > "$WP/wp-content/mu-plugins/growmedica-clean-homepage.php" <<'PHP'
<?php
/**
 * Plugin Name: GrowMedica Clean Homepage
 * Description: Hides the empty WordPress blog on the CMS front page only.
 */
if (!defined('ABSPATH')) { exit; }

function growmedica_is_empty_blog_front_page(): bool {
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) { return false; }
    if (defined('REST_REQUEST') && REST_REQUEST) { return false; }
    return is_front_page() && is_home();
}

function growmedica_storefront_url(): string {
    $from_env = getenv('GROWMEDICA_STOREFRONT_URL')
        ?: (defined('GROWMEDICA_STOREFRONT_URL') ? (string) GROWMEDICA_STOREFRONT_URL : '');
    if (is_string($from_env) && $from_env !== '') {
        return untrailingslashit($from_env);
    }
    return 'https://www.growmedica.cz';
}

add_action('template_redirect', static function (): void {
    if (!growmedica_is_empty_blog_front_page()) { return; }
    $shop = esc_url(growmedica_storefront_url());
    $admin = esc_url(admin_url());
    $site = esc_html(get_bloginfo('name') ?: 'GrowMedica CMS');
    $year = (int) gmdate('Y');
    status_header(200);
    nocache_headers();
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8" />'
        . '<meta name="viewport" content="width=device-width, initial-scale=1" />'
        . '<meta name="robots" content="noindex, nofollow" />'
        . '<title>' . $site . '</title>'
        . '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f7f9;color:#1a1d21;padding:24px}'
        . 'main{width:min(100%,28rem);background:#fff;border:1px solid #e6e8ec;border-radius:16px;padding:2rem 1.75rem;text-align:center;box-shadow:0 8px 30px rgba(16,24,40,.06)}'
        . 'h1{margin:0 0 .5rem;font-size:1.35rem}p{margin:0 0 1.25rem;color:#5b6470;line-height:1.5;font-size:.95rem}'
        . '.actions{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center}'
        . 'a{display:inline-flex;align-items:center;justify-content:center;min-height:2.5rem;padding:0 1rem;border-radius:999px;text-decoration:none;font-weight:600;font-size:.9rem}'
        . 'a.primary{background:#0f766e;color:#fff}a.secondary{background:#eef1f4;color:#1a1d21}'
        . 'footer{margin-top:1.5rem;font-size:.75rem;color:#8a93a0}</style></head><body><main>'
        . '<h1>' . $site . '</h1>'
        . '<p>Headless CMS pre GrowMedica. Verejný e‑shop je na storefronte — tu je správa katalógu a pokladne.</p>'
        . '<div class="actions"><a class="primary" href="' . $shop . '/">Otvoriť e‑shop</a>'
        . '<a class="secondary" href="' . $admin . '">WP Admin</a></div>'
        . '<footer>© ' . $year . ' GrowMedica</footer></main></body></html>';
    exit;
}, 1);
PHP

echo "=== base OK ==="
wp --path="$WP" option get siteurl
wp --path="$WP" option get permalink_structure
wp --path="$WP" plugin list
ls -la "$WP/wp-content/mu-plugins/"
echo SETUP_BASE_DONE
REMOTE
)

if [[ "$WITH_WOO" == "1" ]]; then
  REMOTE_SCRIPT+=$(cat <<'REMOTE'

echo "=== WooCommerce ==="
wp --path="$WP" plugin install woocommerce --activate
wp --path="$WP" option update woocommerce_store_address '' || true
wp --path="$WP" option update woocommerce_default_country 'SK'
wp --path="$WP" option update woocommerce_currency 'EUR'
wp --path="$WP" rewrite structure '/produkt/%postname%/' --hard || true
wp --path="$WP" rewrite flush --hard || true
# REST key (print once)
wp --path="$WP" eval '
$user = get_user_by("login", "info@growmedica.");
if (!$user) { $user = get_users(["role"=>"administrator","number"=>1])[0] ?? null; }
if (!$user) { echo "NO_ADMIN\n"; return; }
global $wpdb;
$key = "ck_" . wp_generate_password(40, false);
$secret = "cs_" . wp_generate_password(40, false);
$wpdb->insert($wpdb->prefix . "woocommerce_api_keys", [
  "user_id" => $user->ID,
  "description" => "GrowMedica Next.js storefront",
  "permissions" => "read_write",
  "consumer_key" => wc_api_hash($key),
  "consumer_secret" => $secret,
  "truncated" => current_time("mysql"),
]);
echo "WOO_KEY_BEGIN\n";
echo "WOO_CONSUMER_KEY=$key\n";
echo "WOO_CONSUMER_SECRET=$secret\n";
echo "WOO_KEY_END\n";
'
echo SETUP_WOO_DONE
REMOTE
)
fi

export REMOTE_SCRIPT
export SSH_HOST SSH_USER SSH_PORT SSH_PASS

expect << 'EOF'
set timeout 300
spawn ssh -o StrictHostKeyChecking=accept-new -p $env(SSH_PORT) $env(SSH_USER)@$env(SSH_HOST)
expect {
  -re "(?i)password:" { send -- "$env(SSH_PASS)\r" }
  timeout { puts "LOGIN_TIMEOUT"; exit 1 }
}
expect {
  -re {\$ $} {}
  -re {Permission denied} { puts "LOGIN_DENIED"; exit 1 }
  timeout { puts "SHELL_TIMEOUT"; exit 1 }
}
send -- "bash -s <<'EOS'\r"
send -- "$env(REMOTE_SCRIPT)\r"
send -- "EOS\r"
expect {
  -re {SETUP_BASE_DONE|SETUP_WOO_DONE} {}
  timeout { puts "REMOTE_TIMEOUT"; exit 1 }
}
expect -re {\$ $}
send -- "exit\r"
expect eof
EOF

echo ""
echo "=== Done. Public check ==="
curl -sI -m 15 "https://cms.growmedica.cz/" | head -8
curl -sI -m 15 "https://www.growmedica.cz/" | head -5
echo ""
echo "Shop stays on Shopify. Do NOT set CMS_PROVIDER=wordpress on Vercel unless cutover."
echo "If --with-woo: copy WOO_CONSUMER_* into gitignored env only."
