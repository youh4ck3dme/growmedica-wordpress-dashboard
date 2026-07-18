#!/usr/bin/env bash
# Quote-safe loader for wordpress-production.local.env (values may contain spaces).
# Usage (bash or zsh): source ./scripts/load-wp-prod-env.sh
#
# Do not `source wordpress-production.local.env` directly — unquoted spaces break
# WORDPRESS_APP_PASSWORD and SMTP_FROM_NAME.

# Resolve this file's directory (bash source, zsh source, or executed)
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  _SF="${BASH_SOURCE[0]}"
elif [[ -n "${ZSH_VERSION:-}" ]]; then
  _SF="${(%):-%x}"
else
  _SF="$0"
fi
_SCRIPT_DIR="$(cd "$(dirname "$_SF")" && pwd)"
_ROOT="$(cd "$_SCRIPT_DIR/.." && pwd)"
_ENV="${GROWMEDICA_WP_ENV:-$_ROOT/wordpress-production.local.env}"

if [[ ! -f "$_ENV" ]]; then
  echo "ERROR: missing $_ENV" >&2
  unset _SF _SCRIPT_DIR _ROOT _ENV
  return 1 2>/dev/null || exit 1
fi

eval "$(
  python3 - "$_ENV" <<'PY'
import shlex, sys
from pathlib import Path
for line in Path(sys.argv[1]).read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    k, v = k.strip(), v.strip()
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        v = v[1:-1]
    print(f"export {k}={shlex.quote(v)}")
PY
)"

export WORDPRESS_BASE_URL="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
unset _SF _SCRIPT_DIR _ROOT _ENV
