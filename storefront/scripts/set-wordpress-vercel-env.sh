#!/usr/bin/env bash
# Push WordPress production env vars to Vercel (growmedica-wordpress-dashboard).
# Usage:
#   ./scripts/set-wordpress-vercel-env.sh
#   WOO_CONSUMER_KEY=ck_... WOO_CONSUMER_SECRET=cs_... MISTRAL_API_KEY=... ./scripts/set-wordpress-vercel-env.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CMS_PROVIDER="${CMS_PROVIDER:-wordpress}"
WORDPRESS_BASE_URL="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://growmedica.cz}"
NEXT_PUBLIC_DASHBOARD_URL="${NEXT_PUBLIC_DASHBOARD_URL:-https://growmedica-nexus.lovable.app/admin}"
NEXT_PUBLIC_DASHBOARD_MODE="${NEXT_PUBLIC_DASHBOARD_MODE:-hybrid}"
WORDPRESS_REVALIDATION_SECRET="${WORDPRESS_REVALIDATION_SECRET:-$(openssl rand -hex 24)}"
MISTRAL_MODEL="${MISTRAL_MODEL:-mistral-large-latest}"
SHOPIFY_STORE_DOMAIN="${SHOPIFY_STORE_DOMAIN:-growmedica.myshopify.com}"
SHOPIFY_API_VERSION="${SHOPIFY_API_VERSION:-2026-07}"

# Until WooCommerce API keys exist on cms.growmedica.cz, mock mode keeps catalog live on Vercel.
WOO_MOCK_MODE="${WOO_MOCK_MODE:-1}"
MISTRAL_MOCK_MODE="${MISTRAL_MOCK_MODE:-1}"

ENVIRONMENTS=(production preview development)
VERCEL_SCOPE="${VERCEL_SCOPE:-h4ck3d}"
VERCEL_PROJECT="${VERCEL_PROJECT:-growmedica-wordpress-dashboard}"

cd "$STOREFRONT_DIR"

if ! command -v vercel >/dev/null 2>&1; then
  echo "ERROR: Vercel CLI required (npm i -g vercel && vercel login)"
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  vercel link --yes --project "$VERCEL_PROJECT" --scope "$VERCEL_SCOPE"
fi

vercel_args=(--scope "$VERCEL_SCOPE" --non-interactive)

remove_env_var() {
  local name=$1
  local target=$2
  vercel env rm "$name" "$target" --yes "${vercel_args[@]}" 2>/dev/null || true
}

upsert_env_var() {
  local name=$1
  local value=$2
  local target=$3
  remove_env_var "$name" "$target"
  printf '%s' "$value" | vercel env add "$name" "$target" --yes "${vercel_args[@]}"
  echo "  ✓ $name → $target"
}

echo "=== GrowMedica WordPress — Vercel env ==="
echo "Project: ${VERCEL_SCOPE}/${VERCEL_PROJECT}"
echo "WORDPRESS_REVALIDATION_SECRET: (generated, ${#WORDPRESS_REVALIDATION_SECRET} chars)"
echo ""

NEXT_PUBLIC_DEFAULT_LOCALE="${NEXT_PUBLIC_DEFAULT_LOCALE:-sk}"
NEXT_PUBLIC_DASHBOARD_MODE="${NEXT_PUBLIC_DASHBOARD_MODE:-hybrid}"
DASHBOARD_AGENT_SECRET="${DASHBOARD_AGENT_SECRET:-$(openssl rand -hex 24)}"

PUBLIC_VARS=(
  "CMS_PROVIDER|$CMS_PROVIDER"
  "WORDPRESS_BASE_URL|$WORDPRESS_BASE_URL"
  "NEXT_PUBLIC_SITE_URL|$NEXT_PUBLIC_SITE_URL"
  "NEXT_PUBLIC_DEFAULT_LOCALE|$NEXT_PUBLIC_DEFAULT_LOCALE"
  "NEXT_PUBLIC_DASHBOARD_URL|$NEXT_PUBLIC_DASHBOARD_URL"
  "NEXT_PUBLIC_DASHBOARD_MODE|$NEXT_PUBLIC_DASHBOARD_MODE"
  "MISTRAL_MODEL|$MISTRAL_MODEL"
  "SHOPIFY_STORE_DOMAIN|$SHOPIFY_STORE_DOMAIN"
  "SHOPIFY_API_VERSION|$SHOPIFY_API_VERSION"
)

SECRET_VARS=(
  "WORDPRESS_REVALIDATION_SECRET|$WORDPRESS_REVALIDATION_SECRET"
  "DASHBOARD_AGENT_SECRET|$DASHBOARD_AGENT_SECRET"
)

if [[ -n "${WOO_CONSUMER_KEY:-}" ]]; then
  SECRET_VARS+=("WOO_CONSUMER_KEY|$WOO_CONSUMER_KEY")
fi
if [[ -n "${WOO_CONSUMER_SECRET:-}" ]]; then
  SECRET_VARS+=("WOO_CONSUMER_SECRET|$WOO_CONSUMER_SECRET")
fi
if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
  SECRET_VARS+=("MISTRAL_API_KEY|$MISTRAL_API_KEY")
  MISTRAL_MOCK_MODE="0"
fi
if [[ -n "${MISTRAL_API_KEY_BACKUP:-}" ]]; then
  SECRET_VARS+=("MISTRAL_API_KEY_BACKUP|$MISTRAL_API_KEY_BACKUP")
fi
if [[ -n "${SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}" ]]; then
  SECRET_VARS+=("SHOPIFY_STOREFRONT_ACCESS_TOKEN|$SHOPIFY_STOREFRONT_ACCESS_TOKEN")
fi
if [[ -n "${SHOPIFY_REVALIDATION_SECRET:-}" ]]; then
  SECRET_VARS+=("SHOPIFY_REVALIDATION_SECRET|$SHOPIFY_REVALIDATION_SECRET")
fi

MOCK_VARS=()
if [[ "$WOO_MOCK_MODE" == "1" ]]; then
  MOCK_VARS+=("WOO_MOCK_MODE|1")
else
  for target in "${ENVIRONMENTS[@]}"; do
    remove_env_var "WOO_MOCK_MODE" "$target"
  done
fi

if [[ "$MISTRAL_MOCK_MODE" == "1" ]]; then
  MOCK_VARS+=("MISTRAL_MOCK_MODE|1")
else
  for target in "${ENVIRONMENTS[@]}"; do
    remove_env_var "MISTRAL_MOCK_MODE" "$target"
  done
fi

for target in "${ENVIRONMENTS[@]}"; do
  echo "→ $target"
  for entry in "${PUBLIC_VARS[@]}"; do
    IFS='|' read -r key val <<< "$entry"
    upsert_env_var "$key" "$val" "$target"
  done
  for entry in "${SECRET_VARS[@]}"; do
    IFS='|' read -r key val <<< "$entry"
    upsert_env_var "$key" "$val" "$target"
  done
  for entry in "${MOCK_VARS[@]}"; do
    IFS='|' read -r key val <<< "$entry"
    upsert_env_var "$key" "$val" "$target"
  done
  remove_env_var "SHOPIFY_MOCK_MODE" "$target"
done

echo ""
echo "=== Hotovo ==="
vercel env ls production "${vercel_args[@]}" 2>&1 | head -30
echo ""
echo "Ďalší krok: vercel --prod"
echo "Po vytvorení Woo API keys na cms.growmedica.cz:"
echo "  WOO_CONSUMER_KEY=ck_... WOO_CONSUMER_SECRET=cs_... WOO_MOCK_MODE=0 ./scripts/set-wordpress-vercel-env.sh"