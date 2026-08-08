#!/usr/bin/env bash
# Activate wordpress-production.local.env from .save backup and validate required keys.
#
# Usage (from repo root):
#   ./scripts/activate-wp-prod-env-from-save.sh
#   ./scripts/activate-wp-prod-env-from-save.sh /path/to/custom.save
#
# Expects: wordpress-production.local.env.save in repo root (or path arg).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAVE="${1:-$ROOT/wordpress-production.local.env.save}"
TARGET="$ROOT/wordpress-production.local.env"

REQUIRED=(
  DB_NAME
  DB_USER
  DB_PASSWORD
  DB_HOST
  WORDPRESS_BASE_URL
  WOO_CONSUMER_KEY
  WOO_CONSUMER_SECRET
  WORDPRESS_ADMIN_USER
  WORDPRESS_APP_PASSWORD
)

if [[ ! -f "$SAVE" ]]; then
  echo "ERROR: missing save file: $SAVE" >&2
  echo "Copy your Mac backup to repo root:" >&2
  echo "  cp wordpress-production.local.env.save wordpress-production.local.env" >&2
  exit 1
fi

if [[ -f "$TARGET" ]]; then
  BAK="$TARGET.bak.$(date +%Y%m%d-%H%M%S)"
  cp "$TARGET" "$BAK"
  echo "Backup: $BAK"
fi

cp "$SAVE" "$TARGET"
echo "Activated: $TARGET"

echo ""
echo "Keys present:"
grep -E '^[A-Z_][A-Z0-9_]*=' "$TARGET" | cut -d= -f1 | sort

echo ""
echo "Validating required keys..."
# shellcheck disable=SC1091
source "$ROOT/scripts/load-wp-prod-env.sh"

missing=0
for key in "${REQUIRED[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "  MISSING: $key"
    missing=$((missing + 1))
  else
    echo "  OK: $key"
  fi
done

if [[ "$missing" -gt 0 ]]; then
  echo ""
  echo "ERROR: $missing required key(s) missing or empty in $TARGET" >&2
  exit 1
fi

echo ""
echo "OK: wordpress-production.local.env loaded via load-wp-prod-env.sh"
echo "WORDPRESS_BASE_URL=${WORDPRESS_BASE_URL:-}"
