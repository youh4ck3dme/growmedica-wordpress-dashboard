#!/usr/bin/env bash
# Push Shopify live catalog env vars to Vercel (growmedica-wordpress-dashboard).
#
# Usage:
#   SHOPIFY_STOREFRONT_ACCESS_TOKEN=... SHOPIFY_REVALIDATION_SECRET=... ./scripts/set-shopify-vercel-env.sh
#   ./scripts/set-shopify-vercel-env.sh --deploy
#
# Optional:
#   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...  (for Nexus/scripts, not required for storefront catalog)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CMS_PROVIDER="${CMS_PROVIDER:-shopify}"
SHOPIFY_STORE_DOMAIN="${SHOPIFY_STORE_DOMAIN:-growmedica.myshopify.com}"
SHOPIFY_API_VERSION="${SHOPIFY_API_VERSION:-2025-01}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://www.growmedica.cz}"
NEXT_PUBLIC_DEFAULT_LOCALE="${NEXT_PUBLIC_DEFAULT_LOCALE:-sk}"
NEXT_PUBLIC_DASHBOARD_URL="${NEXT_PUBLIC_DASHBOARD_URL:-https://growmedica-nexus.lovable.app/admin}"
NEXT_PUBLIC_DASHBOARD_MODE="${NEXT_PUBLIC_DASHBOARD_MODE:-hybrid}"
SHOPIFY_REVALIDATION_SECRET="${SHOPIFY_REVALIDATION_SECRET:-$(openssl rand -hex 24)}"
DASHBOARD_AGENT_SECRET="${DASHBOARD_AGENT_SECRET:-$(openssl rand -hex 24)}"
MISTRAL_MODEL="${MISTRAL_MODEL:-mistral-large-latest}"
MISTRAL_MOCK_MODE="${MISTRAL_MOCK_MODE:-1}"

DEPLOY=false
for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY=true ;;
  esac
done

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

remove_mock_flags() {
  local target=$1
  for flag in SHOPIFY_MOCK_MODE WOO_MOCK_MODE; do
    vercel env rm "$flag" "$target" --yes "${vercel_args[@]}" 2>/dev/null || true
  done
}

SHOPIFY_STOREFRONT_TOKENLESS="${SHOPIFY_STOREFRONT_TOKENLESS:-0}"
if [[ -z "${SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}" ]]; then
  if [[ "$SHOPIFY_STOREFRONT_TOKENLESS" != "1" ]]; then
    echo "ERROR: Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN"
    echo "  Must be Storefront API token (NOT shpat_ Admin token),"
    echo "  or set SHOPIFY_STOREFRONT_TOKENLESS=1 (growmedica.myshopify.com supports tokenless API)."
    echo "  Shopify Admin → Settings → Apps → Develop apps → Storefront API"
    exit 1
  fi
  echo "Using SHOPIFY_STOREFRONT_TOKENLESS=1 (no Storefront token on Vercel)"
elif [[ "$SHOPIFY_STOREFRONT_ACCESS_TOKEN" == shpat_* ]]; then
  echo "ERROR: SHOPIFY_STOREFRONT_ACCESS_TOKEN starts with shpat_ — that is Admin API token."
  exit 1
else
  SHOPIFY_STOREFRONT_TOKENLESS="0"
fi

if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
  MISTRAL_MOCK_MODE="0"
fi

echo "=== GrowMedica Shopify live — Vercel env ==="
echo "Project: ${VERCEL_SCOPE}/${VERCEL_PROJECT}"
echo "CMS_PROVIDER: ${CMS_PROVIDER}"
echo "Store: ${SHOPIFY_STORE_DOMAIN}"
echo ""

PUBLIC_VARS=(
  "CMS_PROVIDER|$CMS_PROVIDER"
  "SHOPIFY_STORE_DOMAIN|$SHOPIFY_STORE_DOMAIN"
  "SHOPIFY_STOREFRONT_TOKENLESS|$SHOPIFY_STOREFRONT_TOKENLESS"
  "SHOPIFY_API_VERSION|$SHOPIFY_API_VERSION"
  "NEXT_PUBLIC_SITE_URL|$NEXT_PUBLIC_SITE_URL"
  "NEXT_PUBLIC_DEFAULT_LOCALE|$NEXT_PUBLIC_DEFAULT_LOCALE"
  "NEXT_PUBLIC_DASHBOARD_URL|$NEXT_PUBLIC_DASHBOARD_URL"
  "NEXT_PUBLIC_DASHBOARD_MODE|$NEXT_PUBLIC_DASHBOARD_MODE"
  "MISTRAL_MODEL|$MISTRAL_MODEL"
)

SECRET_VARS=(
  "SHOPIFY_REVALIDATION_SECRET|$SHOPIFY_REVALIDATION_SECRET"
  "DASHBOARD_AGENT_SECRET|$DASHBOARD_AGENT_SECRET"
)

if [[ -n "${SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}" ]]; then
  SECRET_VARS+=("SHOPIFY_STOREFRONT_ACCESS_TOKEN|$SHOPIFY_STOREFRONT_ACCESS_TOKEN")
fi

if [[ -n "${SHOPIFY_ADMIN_ACCESS_TOKEN:-}" ]]; then
  SECRET_VARS+=("SHOPIFY_ADMIN_ACCESS_TOKEN|$SHOPIFY_ADMIN_ACCESS_TOKEN")
fi
if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
  SECRET_VARS+=("MISTRAL_API_KEY|$MISTRAL_API_KEY")
fi
if [[ -n "${MISTRAL_API_KEY_BACKUP:-}" ]]; then
  SECRET_VARS+=("MISTRAL_API_KEY_BACKUP|$MISTRAL_API_KEY_BACKUP")
fi

for target in "${ENVIRONMENTS[@]}"; do
  echo "→ $target (public)"
  for entry in "${PUBLIC_VARS[@]}"; do
    IFS='|' read -r name value <<< "$entry"
    upsert_env_var "$name" "$value" "$target"
  done
  echo "→ $target (secrets)"
  for entry in "${SECRET_VARS[@]}"; do
    IFS='|' read -r name value <<< "$entry"
    upsert_env_var "$name" "$value" "$target"
  done
  remove_mock_flags "$target"
done

echo ""
echo "=== Done ==="
echo "Verify: vercel env ls production --scope ${VERCEL_SCOPE}"
echo "Then:   vercel --prod --scope ${VERCEL_SCOPE}"
echo "Smoke:  PREVIEW_URL=${NEXT_PUBLIC_SITE_URL} yarn production:smoke"

if [[ "$DEPLOY" == true ]]; then
  echo ""
  echo "=== Deploying production ==="
  REPO_ROOT="$(cd "$STOREFRONT_DIR/.." && pwd)"
  (cd "$REPO_ROOT" && vercel --prod --scope "$VERCEL_SCOPE" "${vercel_args[@]}")
fi
