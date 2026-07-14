#!/usr/bin/env bash
# Presun Vercel projektu growmedica-wordpress-dashboard → team h4ck3d
#
# 1) Na účte u0352652320-8831 (zdroj) vygeneruje transfer code
# 2) Na účte s prístupom k h4ck3d prijme transfer
#
# Usage:
#   ./scripts/transfer-to-h4ck3d.sh request     # krok 1 — zdrojový účet
#   ./scripts/transfer-to-h4ck3d.sh accept CODE   # krok 2 — h4ck3d účet
#   ./scripts/transfer-to-h4ck3d.sh relink        # po transfere — prepoj CLI

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_TEAM_ID="${SOURCE_TEAM_ID:-team_joDOegKoYjtgPN3m3YAzQsKV}"
SOURCE_PROJECT="${SOURCE_PROJECT:-growmedica-wordpress-dashboard}"
TARGET_SCOPE="${TARGET_SCOPE:-h4ck3d}"
TARGET_PROJECT="${TARGET_PROJECT:-growmedica-wordpress-dashboard}"

auth_token() {
  python3 -c "import json; print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])"
}

cmd="${1:-request}"

case "$cmd" in
  request)
    echo "=== Transfer request: ${SOURCE_PROJECT} → team ${TARGET_SCOPE} ==="
    echo "Prihlásený účet: $(vercel whoami 2>/dev/null || echo '?')"
    CODE=$(curl -s -X POST \
      -H "Authorization: Bearer $(auth_token)" \
      -H "Content-Type: application/json" \
      "https://api.vercel.com/projects/${SOURCE_PROJECT}/transfer-request?teamId=${SOURCE_TEAM_ID}" \
      -d '{}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))")

    if [[ -z "$CODE" ]]; then
      echo "ERROR: Nepodarilo sa vytvoriť transfer code."
      exit 1
    fi

    echo ""
    echo "Transfer code (platný 24h):"
    echo "  $CODE"
    echo ""
    echo "Krok 2 — prihlás sa účtom s prístupom k h4ck3d a spusti:"
    echo "  vercel login"
    echo "  cd \"$STOREFRONT_DIR\""
    echo "  ./scripts/transfer-to-h4ck3d.sh accept $CODE"
    echo ""
    echo "Alebo otvor v prehliadači (musíš byť prihlásený na h4ck3d):"
    echo "  https://vercel.com/claim-deployment?code=${CODE}"
    ;;

  accept)
    CODE="${2:-}"
    if [[ -z "$CODE" ]]; then
      echo "Usage: $0 accept <transfer-code>"
      exit 1
    fi

    echo "=== Prijímam transfer do ${TARGET_SCOPE} ==="
    echo "Prihlásený účet: $(vercel whoami 2>/dev/null || echo '?')"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
      -H "Authorization: Bearer $(auth_token)" \
      -H "Content-Type: application/json" \
      "https://api.vercel.com/projects/transfer-request/${CODE}?slug=${TARGET_SCOPE}" \
      -d "{\"newProjectName\":\"${TARGET_PROJECT}\"}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

    if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "202" ]]; then
      echo "ERROR: HTTP $HTTP_CODE — skontroluj či si prihlásený na účet s team h4ck3d"
      exit 1
    fi

    echo ""
    echo "✓ Projekt prenesený. Teraz:"
    echo "  vercel teams switch ${TARGET_SCOPE}"
    echo "  ./scripts/transfer-to-h4ck3d.sh relink"
    echo "  VERCEL_SCOPE=${TARGET_SCOPE} ./scripts/set-wordpress-vercel-env.sh"
    echo "  vercel --prod --scope ${TARGET_SCOPE}"
    ;;

  relink)
    cd "$STOREFRONT_DIR"
    rm -f .vercel/project.json
    vercel link --yes --project "$TARGET_PROJECT" --scope "$TARGET_SCOPE"
    echo "✓ Prepojené na ${TARGET_SCOPE}/${TARGET_PROJECT}"
    vercel project inspect "$TARGET_PROJECT" --scope "$TARGET_SCOPE"
    ;;

  skip-transfer)
    echo "=== Preskočiť transfer — link + deploy priamo na h4ck3d ==="
    echo "Použi ak transfer code expiroval alebo už máš projekt na h4ck3d."
    cd "$STOREFRONT_DIR"
    rm -f .vercel/project.json
    vercel link --yes --project "$TARGET_PROJECT" --scope "$TARGET_SCOPE"
    VERCEL_SCOPE="$TARGET_SCOPE" VERCEL_PROJECT="$TARGET_PROJECT" \
      NEXT_PUBLIC_SITE_URL=https://growmedica.cz "$SCRIPT_DIR/set-wordpress-vercel-env.sh"
    vercel --prod --yes --scope "$TARGET_SCOPE"
    echo ""
    echo "Doménu growmedica.cz pridaj až po odstránení zo starého účtu u0352652320-8831:"
    echo "  Vercel → u0352652320-8831s-projects → growmedica-wordpress-dashboard → Domains → Remove"
    echo "  Potom: cd \"$STOREFRONT_DIR\" && vercel domains add growmedica.cz && vercel domains add www.growmedica.cz"
    ;;

  *)
    echo "Usage: $0 request | accept <code> | relink | skip-transfer"
    exit 1
    ;;
esac