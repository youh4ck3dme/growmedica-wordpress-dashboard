#!/usr/bin/env bash
# Write SuperFaktúra API credentials into Woo options on cms (never commit secrets).
#
# Usage:
#   source ./scripts/load-wp-prod-env.sh
#   export SUPERFAKTURA_API_EMAIL='...'
#   export SUPERFAKTURA_API_KEY='...'
#   export SUPERFAKTURA_COMPANY_ID='...'   # optional if single company
#   ./scripts/set-superfaktura-api-from-env.sh
#
# Or put the three vars into wordpress-production.local.env (gitignored) and load-wp-prod-env.
#
# Docs: docs/SUPERFAKTURA_SETUP.md · majitel.md §2

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/load-wp-prod-env.sh"

CMS_URL="${WORDPRESS_BASE_URL%/}"
USER="${WORDPRESS_ADMIN_USER:-}"
PASS="${WORDPRESS_APP_PASSWORD:-${WORDPRESS_APPLICATION_PASSWORD:-}}"
EMAIL="${SUPERFAKTURA_API_EMAIL:-${SF_API_EMAIL:-}}"
KEY="${SUPERFAKTURA_API_KEY:-${SF_API_KEY:-}}"
CID="${SUPERFAKTURA_COMPANY_ID:-${SF_COMPANY_ID:-}}"

if [[ -z "$USER" || -z "$PASS" ]]; then
  echo "ERROR: WORDPRESS_ADMIN_USER / WORDPRESS_APP_PASSWORD required"
  exit 1
fi
if [[ -z "$EMAIL" || -z "$KEY" ]]; then
  echo "ERROR: set SUPERFAKTURA_API_EMAIL and SUPERFAKTURA_API_KEY"
  echo "  (from https://moja.superfaktura.sk/ → Nástroje → API)"
  exit 1
fi

python3 - "$CMS_URL" "$USER" "$PASS" "$EMAIL" "$KEY" "$CID" <<'PY'
import base64, json, sys, urllib.request, urllib.error

base, user, password, email, key, cid = sys.argv[1:7]
token = base64.b64encode(f"{user}:{password}".encode()).decode()

def rest(path, method="GET", payload=None):
    data = None
    headers = {
        "Authorization": f"Basic {token}",
        "User-Agent": "growmedica-set-superfaktura-api",
        "Accept": "application/json",
    }
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            body = json.loads(raw) if raw else {}
        except Exception:
            body = {"raw": raw[:500]}
        return e.code, body

# One-shot snippet: set options then self-deactivate + delete via flag
SNIPPET_NAME = "GrowMedica SuperFaktura API set (ephemeral)"
# Escape for PHP single-quoted strings
def php_sq(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")

code = f"""
if (!defined('ABSPATH')) {{ return; }}
add_action('init', function () {{
	update_option('woocommerce_sf_email', '{php_sq(email)}');
	update_option('woocommerce_sf_apikey', '{php_sq(key)}');
	update_option('woocommerce_sf_company_id', '{php_sq(cid)}');
	update_option('woocommerce_sf_lang', 'sk');
	update_option('woocommerce_sf_sandbox', 'no');
	update_option('growmedica_sf_api_set_at', gmdate('c'));
}}, 5);
"""

st, snippets = rest("/wp-json/code-snippets/v1/snippets?per_page=100")
if st != 200 or not isinstance(snippets, list):
    raise SystemExit(f"Cannot list snippets: {st} {snippets}")

existing = next((s for s in snippets if s.get("name") == SNIPPET_NAME), None)
payload = {
    "name": SNIPPET_NAME,
    "code": code.strip(),
    "scope": "global",
    "active": True,
    "priority": 1,
}

if existing:
    sid = existing["id"]
    st2, body2 = rest(f"/wp-json/code-snippets/v1/snippets/{sid}", "PUT", payload)
else:
    st2, body2 = rest("/wp-json/code-snippets/v1/snippets", "POST", payload)
    sid = body2.get("id") if isinstance(body2, dict) else None

if st2 not in (200, 201) or not sid:
    raise SystemExit(f"Snippet deploy failed: {st2} {body2}")

# Activate (PUT active may not run code until activate)
rest(f"/wp-json/code-snippets/v1/snippets/{sid}/activate", "POST")

# Hit a front-end request to trigger init
urllib.request.urlopen(urllib.request.Request(
    base + "/",
    headers={"User-Agent": "growmedica-set-superfaktura-api"},
), timeout=45).read(200)

# Deactivate + delete ephemeral snippet (credentials already in options)
rest(f"/wp-json/code-snippets/v1/snippets/{sid}/deactivate", "POST")
rest(f"/wp-json/code-snippets/v1/snippets/{sid}", "DELETE")

st3, status = rest("/wp-json/growmedica/v1/sf-status")
print(json.dumps({
    "http": st3,
    "api_email_set": status.get("api_email_set") if isinstance(status, dict) else None,
    "api_email_hint": status.get("api_email_hint") if isinstance(status, dict) else None,
    "api_key_set": status.get("api_key_set") if isinstance(status, dict) else None,
    "company_id_set": status.get("company_id_set") if isinstance(status, dict) else None,
    "sandbox": status.get("sandbox") if isinstance(status, dict) else None,
    "lang": status.get("lang") if isinstance(status, dict) else None,
    "settings_url": status.get("settings_url") if isinstance(status, dict) else None,
}, indent=2))

if not (isinstance(status, dict) and status.get("api_email_set") and status.get("api_key_set")):
    raise SystemExit("FAIL: API options not visible on sf-status — check App Password / snippet rights")

print("OK — credentials written. In WP admin click Test API connection, then run:")
print("  ./scripts/smoke-superfaktura-30.sh")
print("  ./scripts/smoke-superfaktura-bacs-order.sh")
PY
