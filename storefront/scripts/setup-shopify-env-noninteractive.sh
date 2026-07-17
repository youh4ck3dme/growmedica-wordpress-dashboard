#!/usr/bin/env bash
# Non-interactive Shopify .env.local setup (for CI or scripted deploy prep).
#
# Usage:
#   SHOPIFY_STOREFRONT_ACCESS_TOKEN=... SHOPIFY_REVALIDATION_SECRET=... ./scripts/setup-shopify-env-noninteractive.sh
#   ./scripts/setup-shopify-env-noninteractive.sh --smoke

set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=".env.local"
RUN_SMOKE=false

for arg in "$@"; do
  case "$arg" in
    --smoke) RUN_SMOKE=true ;;
  esac
done

SHOPIFY_STORE_DOMAIN="${SHOPIFY_STORE_DOMAIN:-growmedica.myshopify.com}"
SHOPIFY_API_VERSION="${SHOPIFY_API_VERSION:-2026-07}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:5555}"

SHOPIFY_STOREFRONT_TOKENLESS="${SHOPIFY_STOREFRONT_TOKENLESS:-0}"
if [[ -z "${SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}" ]]; then
  if [[ "$SHOPIFY_STOREFRONT_TOKENLESS" == "1" ]]; then
    echo "OK: SHOPIFY_STOREFRONT_TOKENLESS=1 (no Storefront token required)"
  else
    echo "ERROR: Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN (or set SHOPIFY_STOREFRONT_TOKENLESS=1)"
    exit 1
  fi
elif [[ "$SHOPIFY_STOREFRONT_ACCESS_TOKEN" == shpat_* ]]; then
  echo "ERROR: Storefront token must NOT start with shpat_ (Admin token)"
  exit 1
fi
if [[ -z "${SHOPIFY_REVALIDATION_SECRET:-}" ]] || [[ ${#SHOPIFY_REVALIDATION_SECRET} -lt 16 ]]; then
  echo "ERROR: SHOPIFY_REVALIDATION_SECRET required (min 16 chars)"
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  cp "$ENV_FILE" ".env.local.backup.$(date +%Y%m%d-%H%M%S)"
fi

cat > "$ENV_FILE" <<EOF
# CMS — live Shopify catalog (growmedica.myshopify.com)
CMS_PROVIDER=shopify

SHOPIFY_STORE_DOMAIN=${SHOPIFY_STORE_DOMAIN}
SHOPIFY_STOREFRONT_TOKENLESS=${SHOPIFY_STOREFRONT_TOKENLESS}
SHOPIFY_STOREFRONT_ACCESS_TOKEN=${SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}
SHOPIFY_ADMIN_ACCESS_TOKEN=${SHOPIFY_ADMIN_ACCESS_TOKEN:-}
SHOPIFY_REVALIDATION_SECRET=${SHOPIFY_REVALIDATION_SECRET}
SHOPIFY_API_VERSION=${SHOPIFY_API_VERSION}

NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL:-https://growmedica-nexus.lovable.app/admin}
NEXT_PUBLIC_DASHBOARD_MODE=${NEXT_PUBLIC_DASHBOARD_MODE:-hybrid}
EOF

chmod 600 "$ENV_FILE"
echo "OK: $ENV_FILE written (CMS_PROVIDER=shopify)"

if [[ "$RUN_SMOKE" == true ]]; then
  node scripts/shopify-smoke-test.mjs
fi
