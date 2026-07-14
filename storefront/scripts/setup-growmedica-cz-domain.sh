#!/usr/bin/env bash
# Priradí growmedica.cz k Vercel projektu growmedica-wordpress-dashboard a nastaví env.
# DNS záznamy musíš zmeniť u registrátora (aktuálne WebSupport → 37.9.175.131).
#
# Usage:
#   ./scripts/setup-growmedica-cz-domain.sh
#   ./scripts/setup-growmedica-cz-domain.sh --deploy

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERCEL_SCOPE="${VERCEL_SCOPE:-h4ck3d}"
VERCEL_PROJECT="${VERCEL_PROJECT:-growmedica-wordpress-dashboard}"
DEPLOY=false

for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY=true ;;
  esac
done

cd "$STOREFRONT_DIR"

if ! command -v vercel >/dev/null 2>&1; then
  echo "ERROR: nainštaluj Vercel CLI (npm i -g vercel && vercel login)"
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  vercel link --yes --project "$VERCEL_PROJECT" --scope "$VERCEL_SCOPE"
fi

echo "=== 1/3 Domény na Vercel projekte (${VERCEL_SCOPE}/${VERCEL_PROJECT}) ==="
vercel domains add growmedica.cz --scope "$VERCEL_SCOPE" 2>/dev/null || true
vercel domains add www.growmedica.cz --scope "$VERCEL_SCOPE" 2>/dev/null || true

echo ""
echo "=== 2/3 Env premenné (growmedica.cz) ==="
NEXT_PUBLIC_SITE_URL=https://growmedica.cz "$SCRIPT_DIR/set-wordpress-vercel-env.sh"

if [[ "$DEPLOY" == true ]]; then
  echo ""
  echo "=== 3/3 Production deploy ==="
  vercel --prod --yes --scope "$VERCEL_SCOPE"
else
  echo ""
  echo "=== 3/3 Deploy preskočený (pridaj --deploy) ==="
fi

cat <<'EOF'

=== DNS u registrátora (WebSupport / kde máš growmedica.cz) ===

Aktuálne growmedica.cz smeruje na starý hosting (37.9.175.131).
Pre Vercel zmeň záznamy na:

  Typ     Host    Hodnota
  ─────────────────────────────────────
  A       @       76.76.21.21
  CNAME   www     cname.vercel-dns.com

(Presné hodnoty over v dashboarde:
 https://vercel.com/${VERCEL_SCOPE}/${VERCEL_PROJECT}/settings/domains )

Po propagácii DNS (5–60 min) over:
  curl -I https://growmedica.cz
  curl -I https://www.growmedica.cz

Starý nexify projekt (growmedicanextjs) ostáva na:
  https://growmedica.nexify-studio.tech
kým growmedica.cz neprepneme.

EOF