#!/usr/bin/env bash
# Taxonomy-only dry-run against live CMS using production Woo keys.
# Does NOT print secrets. Does NOT write to Woo when --dry-run is set (default).
#
# Why: storefront/.env.local points at localhost:8080; live keys live in
# wordpress-production.local.env. loadEnvLocal only fills missing vars, so we
# must export production WORDPRESS_BASE_URL + WOO_* first.
#
# Usage:
#   ./scripts/run-taxonomy-dry-run.sh
#   ./scripts/run-taxonomy-dry-run.sh --preflight-only
#   ./scripts/run-taxonomy-dry-run.sh --limit-note   # just print coverage

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STORE="$ROOT/storefront"
PROD_ENV="$ROOT/wordpress-production.local.env"

if [[ ! -f "$PROD_ENV" ]]; then
  echo "ERROR: missing $PROD_ENV (gitignored production Woo credentials)"
  exit 1
fi

# Load only the three Woo vars (safe names, no echo of values)
eval "$(
  python3 - "$PROD_ENV" <<'PY'
import re, sys
from pathlib import Path
path = Path(sys.argv[1])
want = {"WORDPRESS_BASE_URL", "WOO_CONSUMER_KEY", "WOO_CONSUMER_SECRET"}
vals = {}
for line in path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    k, v = k.strip(), v.strip()
    if k not in want:
        continue
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
    vals[k] = v
missing = want - vals.keys()
if missing:
    raise SystemExit(f"missing keys in env file: {sorted(missing)}")
for k, v in vals.items():
    # shell-escape single quotes
    esc = v.replace("'", "'\"'\"'")
    print(f"export {k}='{esc}'")
PY
)"

# Force CMS host even if file had trailing path issues
export WORDPRESS_BASE_URL="https://cms.growmedica.cz"

echo "host=$WORDPRESS_BASE_URL"
echo "woo_key_prefix=${WOO_CONSUMER_KEY:0:8}…"
echo "mode: taxonomy-only dry-run (no writes)"

cd "$STORE"
if [[ "${1:-}" == "--preflight-only" ]]; then
  exec node scripts/import-shopify-to-woo.mjs --preflight-only
fi

exec node scripts/import-shopify-to-woo.mjs --taxonomy-only --dry-run
