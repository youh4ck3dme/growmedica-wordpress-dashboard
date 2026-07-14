#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=".env.local"
BACKUP=".env.local.backup.$(date +%Y%m%d-%H%M%S)"

is_placeholder_token() {
  local v="$1"
  [[ -z "$v" ]] && return 0
  [[ "$v" == "..." ]] && return 0
  [[ "$v" == your-* ]] && return 0
  [[ "$v" == *your-storefront* ]] && return 0
  return 1
}

prompt_domain() {
  local default="growmedica.myshopify.com"
  while true; do
    read -r -p "SHOPIFY_STORE_DOMAIN [$default]: " val
    val="${val:-$default}"
    if [[ "$val" == *.myshopify.com ]]; then
      SHOPIFY_STORE_DOMAIN="$val"
      return 0
    fi
    echo "Chyba: musi koncit na .myshopify.com (napr. growmedica.myshopify.com)"
  done
}

prompt_storefront_token() {
  while true; do
    read -r -s -p "SHOPIFY_STOREFRONT_ACCESS_TOKEN (Storefront API, nie Admin shpat_): " val
    echo
    if is_placeholder_token "$val"; then
      echo "Chyba: placeholder alebo prazdne. V Shopify Admin: Settings -> Apps -> Storefront API token."
      continue
    fi
    if [[ "$val" == shpat_* ]]; then
      echo "Chyba: toto vyzera ako Admin API token (shpat_). Potrebujes Storefront access token."
      continue
    fi
    if [[ ${#val} -lt 10 ]]; then
      echo "Chyba: token je prilis kratky."
      continue
    fi
    SHOPIFY_STOREFRONT_ACCESS_TOKEN="$val"
    return 0
  done
}

prompt_revalidation_secret() {
  while true; do
    read -r -s -p "SHOPIFY_REVALIDATION_SECRET (min 16 znakov, custom string, nie shpat_): " val
    echo
    if [[ -z "$val" ]]; then
      echo "Chyba: povinne pre /api/revalidate."
      continue
    fi
    if [[ ${#val} -lt 16 ]]; then
      echo "Chyba: minimalne 16 znakov (podla env.ts)."
      continue
    fi
    if [[ "$val" == shpat_* ]]; then
      echo "Chyba: nesmie zacinat na shpat_ — to je Admin token, nie webhook secret."
      continue
    fi
    SHOPIFY_REVALIDATION_SECRET="$val"
    return 0
  done
}

prompt_api_version() {
  local default="2025-01"
  while true; do
    read -r -p "SHOPIFY_API_VERSION [$default]: " val
    val="${val:-$default}"
    if [[ "$val" =~ ^[0-9]{4}-[0-9]{2}$ ]]; then
      SHOPIFY_API_VERSION="$val"
      return 0
    fi
    echo "Chyba: format musi byt YYYY-MM (napr. 2025-01)."
  done
}

prompt_site_url() {
  local default="http://localhost:5555"
  while true; do
    read -r -p "NEXT_PUBLIC_SITE_URL [$default]: " val
    val="${val:-$default}"
    if [[ "$val" == http://* || "$val" == https://* ]]; then
      NEXT_PUBLIC_SITE_URL="$val"
      return 0
    fi
    echo "Chyba: URL musi zacinat http:// alebo https://"
  done
}

if [[ -f "$ENV_FILE" ]]; then
  cp "$ENV_FILE" "$BACKUP"
  echo "Zaloha: $BACKUP"
fi

echo ""
echo "=== GrowMedica storefront — nastavenie .env.local ==="
echo "(Hodnoty sa nezobrazia; uklada sa do storefront/.env.local)"
echo ""

prompt_domain
prompt_storefront_token
prompt_revalidation_secret
prompt_api_version
prompt_site_url

cat > "$ENV_FILE" <<EOF
# Shopify — server-side only (never commit)
SHOPIFY_STORE_DOMAIN=${SHOPIFY_STORE_DOMAIN}
SHOPIFY_STOREFRONT_ACCESS_TOKEN=${SHOPIFY_STOREFRONT_ACCESS_TOKEN}
SHOPIFY_REVALIDATION_SECRET=${SHOPIFY_REVALIDATION_SECRET}
SHOPIFY_API_VERSION=${SHOPIFY_API_VERSION}

# Public site URL
NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
EOF

chmod 600 "$ENV_FILE"

echo ""
echo "OK: $ENV_FILE ulozeny."
echo ""
echo "Kontrola (bez tokenov):"
grep -E '^(SHOPIFY_STORE_DOMAIN|SHOPIFY_API_VERSION|NEXT_PUBLIC_SITE_URL)=' "$ENV_FILE"
grep -q '^SHOPIFY_STOREFRONT_ACCESS_TOKEN=.' "$ENV_FILE" && echo "SHOPIFY_STOREFRONT_ACCESS_TOKEN=PRESENT" || echo "SHOPIFY_STOREFRONT_ACCESS_TOKEN=MISSING"
grep -q '^SHOPIFY_REVALIDATION_SECRET=.' "$ENV_FILE" && echo "SHOPIFY_REVALIDATION_SECRET=PRESENT" || echo "SHOPIFY_REVALIDATION_SECRET=MISSING"

echo ""
read -r -p "Spustit yarn build na overenie env.ts? [Y/n]: " run_build
if [[ "${run_build:-Y}" =~ ^[Yy]$ ]]; then
  yarn build
  echo "Build OK — env preslo validaciou."
fi

echo ""
echo "Tip: yarn pull:env stiahne hodnoty z Vercel (development). Korenovy /.env.local je pre Docker PHP."
