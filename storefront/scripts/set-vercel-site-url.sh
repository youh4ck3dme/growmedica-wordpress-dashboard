#!/usr/bin/env bash
# Set NEXT_PUBLIC_SITE_URL on Vercel for growmedicanextjs (Production + Preview).
# Usage: bash scripts/set-vercel-site-url.sh [url]
# Default: https://growmedica.nexify-studio.tech

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SITE_URL="${1:-https://growmedica.nexify-studio.tech}"
SCOPE="${VERCEL_SCOPE:-h4ck3d}"
PROJECT="${VERCEL_PROJECT:-growmedicanextjs}"

if [[ ! "$SITE_URL" =~ ^https:// ]]; then
  echo "Error: SITE_URL must start with https:// (got: $SITE_URL)" >&2
  exit 1
fi

echo "Setting NEXT_PUBLIC_SITE_URL=$SITE_URL on $SCOPE/$PROJECT"
cd "$STOREFRONT_DIR"

if [[ ! -f .vercel/project.json ]]; then
  vercel link --yes --project "$PROJECT" --scope "$SCOPE"
fi

for env in production preview; do
  vercel env rm NEXT_PUBLIC_SITE_URL "$env" --yes --scope "$SCOPE" 2>/dev/null || true
  if [[ "$env" == "preview" ]]; then
    printf '%s' "$SITE_URL" | vercel env add NEXT_PUBLIC_SITE_URL preview --yes --scope "$SCOPE" 2>/dev/null || \
      echo "  ⚠ preview: set manually in Vercel UI (all Preview branches) if CLI prompts for git branch"
  else
    printf '%s' "$SITE_URL" | vercel env add NEXT_PUBLIC_SITE_URL "$env" --scope "$SCOPE"
  fi
  echo "  ✓ $env"
done

echo "Done. Redeploy production: vercel --prod --scope $SCOPE"
