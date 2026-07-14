#!/bin/bash
set -euo pipefail

# Push Shopify env vars to Vercel from a local env file (never commit real values).
# Usage: ENV_FILE=.env.local ./add-vercel-env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env.local}"

echo "===================================================="
echo "Configure Vercel environment variables (from env file)"
echo "===================================================="

if ! command -v vercel &> /dev/null; then
  echo "ERROR: Vercel CLI is not installed."
  echo "Install with: npm install -g vercel"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file not found: $ENV_FILE"
  echo "Copy storefront/.env.example to storefront/.env.local and fill in values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

SHOPIFY_STORE_DOMAIN="${SHOPIFY_STORE_DOMAIN:-${NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN:-}}"
SHOPIFY_STOREFRONT_ACCESS_TOKEN="${SHOPIFY_STOREFRONT_ACCESS_TOKEN:-${NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}}"

REQUIRED_VARS=(
  SHOPIFY_STORE_DOMAIN
  SHOPIFY_STOREFRONT_ACCESS_TOKEN
  SHOPIFY_REVALIDATION_SECRET
)

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: Missing required variable in $ENV_FILE: $var"
    exit 1
  fi
done

ENVIRONMENTS=("production" "preview" "development")

add_env_var() {
  local name=$1
  local value=$2

  echo "Adding $name..."
  for target in "${ENVIRONMENTS[@]}"; do
    if printf '%s' "$value" | vercel env add "$name" "$target" 2>/dev/null; then
      echo "  - Added to $target"
    else
      echo "  - Notice: $name in $target may already exist or needs manual review."
    fi
  done
}

add_env_var "SHOPIFY_STORE_DOMAIN" "$SHOPIFY_STORE_DOMAIN"
add_env_var "SHOPIFY_STOREFRONT_ACCESS_TOKEN" "$SHOPIFY_STOREFRONT_ACCESS_TOKEN"
add_env_var "SHOPIFY_REVALIDATION_SECRET" "$SHOPIFY_REVALIDATION_SECRET"

if [[ -n "${NEXT_PUBLIC_SITE_URL:-}" ]]; then
  add_env_var "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL"
fi

echo "===================================================="
echo "Done. Verify in Vercel dashboard, then deploy."
echo "===================================================="
