#!/bin/bash
set -euo pipefail

# Push WooCommerce / storefront env vars to Vercel from a local env file (never commit real values).
# Usage: ENV_FILE=.env.local ./add-vercel-env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env.local}"

echo "===================================================="
echo "Configure Vercel environment variables (Woo only)"
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

REQUIRED_VARS=(
  WORDPRESS_BASE_URL
  WOO_CONSUMER_KEY
  WOO_CONSUMER_SECRET
  WORDPRESS_REVALIDATION_SECRET
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

add_env_var "WORDPRESS_BASE_URL" "$WORDPRESS_BASE_URL"
add_env_var "WOO_CONSUMER_KEY" "$WOO_CONSUMER_KEY"
add_env_var "WOO_CONSUMER_SECRET" "$WOO_CONSUMER_SECRET"
add_env_var "WORDPRESS_REVALIDATION_SECRET" "$WORDPRESS_REVALIDATION_SECRET"

if [[ -n "${NEXT_PUBLIC_SITE_URL:-}" ]]; then
  add_env_var "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL"
fi
if [[ -n "${SITE_NOINDEX:-}" ]]; then
  add_env_var "SITE_NOINDEX" "$SITE_NOINDEX"
fi
if [[ -n "${NEXT_PUBLIC_SITE_NOINDEX:-}" ]]; then
  add_env_var "NEXT_PUBLIC_SITE_NOINDEX" "$NEXT_PUBLIC_SITE_NOINDEX"
fi
if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
  add_env_var "MISTRAL_API_KEY" "$MISTRAL_API_KEY"
fi
if [[ -n "${DASHBOARD_AGENT_SECRET:-}" ]]; then
  add_env_var "DASHBOARD_AGENT_SECRET" "$DASHBOARD_AGENT_SECRET"
fi

echo "===================================================="
echo "Done. Verify in Vercel dashboard, then deploy."
echo "===================================================="
