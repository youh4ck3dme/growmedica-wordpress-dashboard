#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="$(echo "$key" | xargs)"
    export "$key=$value"
  done < .env.local
fi

if [[ -f ../wordpress-credentials.local.env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="$(echo "$key" | xargs)"
    # Do not override storefront .env.local values
    if [[ -z "${!key:-}" ]]; then
      export "$key=$value"
    fi
  done < ../wordpress-credentials.local.env
fi

BASE_URL="${WORDPRESS_BASE_URL:-http://localhost:8080}"
KEY="${WOO_CONSUMER_KEY:-}"
SECRET="${WOO_CONSUMER_SECRET:-}"

if [[ -z "$KEY" || -z "$SECRET" || "$KEY" == ck_your-* ]]; then
  echo "⚠️  WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET not set in .env.local"
  echo "   Testing public WP REST (no auth)..."
  URL="${BASE_URL}/wp-json/wc/v3/products?per_page=1"
else
  URL="${BASE_URL}/wp-json/wc/v3/products?per_page=1&consumer_key=${KEY}&consumer_secret=${SECRET}"
fi

echo "→ GET $URL"
HTTP=$(curl -s -o /tmp/woo-smoke.json -w '%{http_code}' "$URL")
BODY=$(head -c 300 /tmp/woo-smoke.json)

echo "HTTP $HTTP"
echo "$BODY"

if [[ "$HTTP" != "200" ]]; then
  echo "❌ Smoke test failed"
  exit 1
fi

echo "✅ WooCommerce REST API reachable"
