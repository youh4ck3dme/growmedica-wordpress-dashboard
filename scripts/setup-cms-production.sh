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
echo "=== base OK ==="
wp --path="$WP" option get siteurl
wp --path="$WP" option get permalink_structure
wp --path="$WP" plugin list
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
