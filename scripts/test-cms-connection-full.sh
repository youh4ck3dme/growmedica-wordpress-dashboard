#!/usr/bin/env bash
# Full CMS + storefront connection test chain (plan: CMS DB env obnova).
#
# Usage:
#   ./scripts/test-cms-connection-full.sh
#   SKIP_COUNTRIES=1 ./scripts/test-cms-connection-full.sh
#
# Loads wordpress-production.local.env when present.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0
ENV_LOADED=0

pass() { echo "  PASS: $*"; }
fail() { echo "  FAIL: $*"; FAILED=1; }

if [[ -f "$ROOT/wordpress-production.local.env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/scripts/load-wp-prod-env.sh" && ENV_LOADED=1
  echo "Loaded wordpress-production.local.env"
else
  echo "WARN: $ROOT/wordpress-production.local.env missing — HTTP-only tests"
fi

echo ""
echo "=== Level 1: CMS HTTP ==="
check_url() {
  local url="$1" label="$2"
  local code title
  code=$(curl -s -o /tmp/cms_test_body.html -w '%{http_code}' -L --max-time 25 "$url" 2>/dev/null || echo "000")
  title=$(grep -oP '(?<=<title>)[^<]+' /tmp/cms_test_body.html 2>/dev/null | head -1 || echo "-")
  if [[ "$code" == "200" ]]; then
    pass "$label HTTP $code"
  else
    fail "$label HTTP $code ($title)"
  fi
}

check_url "https://cms.growmedica.cz/" "cms root"
check_url "https://cms.growmedica.cz/wp-json/" "cms wp-json"
check_url "https://cms.growmedica.cz/kontrola-objednavky" "cms checkout"

if [[ "$ENV_LOADED" -eq 1 ]]; then
  echo ""
  echo "=== Level 2: Woo REST ==="
  CMS="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
  CMS="${CMS%/}"
  URL="${CMS}/wp-json/wc/v3/products?per_page=1&consumer_key=${WOO_CONSUMER_KEY}&consumer_secret=${WOO_CONSUMER_SECRET}"
  HTTP=$(curl -s -o /tmp/woo_rest.json -w '%{http_code}' --max-time 25 "$URL" 2>/dev/null || echo "000")
  if [[ "$HTTP" == "200" ]] && head -c 5 /tmp/woo_rest.json | grep -q '\['; then
    pass "Woo REST HTTP $HTTP"
  else
    fail "Woo REST HTTP $HTTP — $(head -c 120 /tmp/woo_rest.json)"
  fi

  if [[ -f "$ROOT/storefront/scripts/woo-smoke-test.sh" ]]; then
    (cd "$ROOT/storefront" && bash scripts/woo-smoke-test.sh) && pass "woo-smoke-test.sh" || fail "woo-smoke-test.sh"
  fi

  echo ""
  echo "=== Level 3: WP Application Password ==="
  ME_HTTP=$(curl -s -o /tmp/wp_me.json -w '%{http_code}' -u "${WORDPRESS_ADMIN_USER}:${WORDPRESS_APP_PASSWORD}" \
    "${CMS}/wp-json/wp/v2/users/me" --max-time 25 2>/dev/null || echo "000")
  if [[ "$ME_HTTP" == "200" ]] && grep -q '"id"' /tmp/wp_me.json 2>/dev/null; then
    pass "WP users/me HTTP $ME_HTTP"
  else
    fail "WP users/me HTTP $ME_HTTP — $(head -c 120 /tmp/wp_me.json)"
  fi
fi

echo ""
echo "=== Level 4: Storefront production smoke ==="
if [[ -d "$ROOT/storefront/node_modules" ]]; then
  (cd "$ROOT/storefront" && PREVIEW_URL=https://www.growmedica.cz yarn production:smoke) \
    && pass "production:smoke" || fail "production:smoke"
else
  API_HTTP=$(curl -s -o /tmp/www_api.json -w '%{http_code}' --max-time 25 \
    "https://www.growmedica.cz/api/products?limit=1" 2>/dev/null || echo "000")
  if [[ "$API_HTTP" == "200" ]] && grep -q 'gid://woocommerce' /tmp/www_api.json 2>/dev/null; then
    pass "www /api/products HTTP $API_HTTP"
  else
    fail "www /api/products HTTP $API_HTTP — $(head -c 120 /tmp/www_api.json)"
  fi
fi

if [[ "$ENV_LOADED" -eq 1 && "${SKIP_COUNTRIES:-0}" != "1" ]]; then
  echo ""
  echo "=== Level 5: gm_cart redirect (needs 2 product IDs) ==="
  CMS="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
  CMS="${CMS%/}"
  if [[ -f /tmp/woo_rest.json ]]; then
    ID1=$(python3 -c "import json; d=json.load(open('/tmp/woo_rest.json')); print(d[0]['id'] if d else '')" 2>/dev/null || true)
    ID2=$(python3 -c "import json; d=json.load(open('/tmp/woo_rest.json')); print(d[1]['id'] if len(d)>1 else d[0]['id'] if d else '')" 2>/dev/null || true)
    if [[ -n "$ID1" && -n "$ID2" ]]; then
      LOC=$(curl -sI -m 20 "${CMS}/?gm_cart=${ID1}:1,${ID2}:1&gm_to=checkout" | grep -i '^location:' | tr -d '\r' || true)
      if echo "$LOC" | grep -qi 'kontrola-objednavky\|checkout'; then
        pass "gm_cart redirect — $LOC"
      else
        fail "gm_cart redirect — $LOC"
      fi
    else
      echo "  SKIP: no product IDs from Woo REST"
    fi
  fi

  echo ""
  echo "=== Level 6: smoke-woo-countries ==="
  if [[ -x "$ROOT/scripts/smoke-woo-countries-cz-at-hu-pl.sh" ]]; then
    "$ROOT/scripts/smoke-woo-countries-cz-at-hu-pl.sh" && pass "smoke-woo-countries" || fail "smoke-woo-countries"
  fi
fi

echo ""
echo "=========================================="
if [[ "$FAILED" -eq 0 ]]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "SOME CHECKS FAILED"
  exit 1
fi
