#!/usr/bin/env bash
# 30× SuperFaktúra stability smoke against cms.growmedica.cz
#
# Usage:
#   set -a; source wordpress-production.local.env; set +a
#   export WORDPRESS_BASE_URL=https://cms.growmedica.cz
#   ./scripts/smoke-superfaktura-30.sh
#
# Modes:
#   (default)             require api_email_set + api_key_set (full green)
#   ALLOW_WITHOUT_API=1   only plugin_active + defaults (infra smoke while waiting for keys)
#   ITERATIONS=30         override loop count
#   SLEEP_MS=100          pause between calls (ms)
#
# Docs: docs/SUPERFAKTURA_SETUP.md · docs/reference/superfaktura-api-pattern.md

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMS_URL="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
CMS_URL="${CMS_URL%/}"
USER="${WORDPRESS_ADMIN_USER:-${WP_ADMIN_USER:-}}"
PASS="${WORDPRESS_APP_PASSWORD:-${WORDPRESS_APPLICATION_PASSWORD:-}}"
ITERATIONS="${ITERATIONS:-30}"
ALLOW_WITHOUT_API="${ALLOW_WITHOUT_API:-0}"
SLEEP_MS="${SLEEP_MS:-100}"

if [[ "$CMS_URL" == *"localhost"* || "$CMS_URL" == *"127.0.0.1"* ]]; then
  echo "ERROR: WORDPRESS_BASE_URL points to local ($CMS_URL). Use https://cms.growmedica.cz"
  exit 1
fi

if [[ -z "$USER" || -z "$PASS" ]]; then
  echo "ERROR: set WORDPRESS_ADMIN_USER and WORDPRESS_APP_PASSWORD"
  echo "  set -a; source wordpress-production.local.env; set +a"
  exit 1
fi

python3 - "$CMS_URL" "$USER" "$PASS" "$ITERATIONS" "$ALLOW_WITHOUT_API" "$SLEEP_MS" <<'PY'
import base64, json, sys, time, urllib.error, urllib.request

base, user, password, iterations_s, allow_without, sleep_ms_s = sys.argv[1:7]
iterations = max(1, int(iterations_s))
allow_without = allow_without == "1"
sleep_s = max(0, int(sleep_ms_s)) / 1000.0
auth = base64.b64encode(f"{user}:{password}".encode()).decode()
url = f"{base.rstrip('/')}/wp-json/growmedica/v1/sf-status"

def fetch():
    req = urllib.request.Request(url, headers={
        "Authorization": f"Basic {auth}",
        "Accept": "application/json",
        "User-Agent": "growmedica-smoke-superfaktura-30",
    })
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.status, json.loads(r.read().decode())

print(f"=== SuperFaktúra smoke ×{iterations} ===")
print(f"URL: {url}")
print(f"require_api: {not allow_without}")
print()

ok = 0
first = None
for i in range(1, iterations + 1):
    try:
        status, data = fetch()
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:400]
        print(f"[{i}/{iterations}] FAIL HTTP {e.code}: {body}")
        sys.exit(1)
    except Exception as e:
        print(f"[{i}/{iterations}] FAIL {type(e).__name__}: {e}")
        sys.exit(1)

    if first is None:
        first = data

    checks = [
        ("plugin_active", data.get("plugin_active") is True),
        ("lang_sk", data.get("lang") == "sk"),
        ("sandbox_off", data.get("sandbox") is False),
        ("defaults_applied", data.get("defaults_applied") is True),
    ]
    if not allow_without:
        checks.extend([
            ("api_email_set", data.get("api_email_set") is True),
            ("api_key_set", data.get("api_key_set") is True),
        ])

    failed = [name for name, passed in checks if not passed]
    if failed or status != 200:
        print(f"[{i}/{iterations}] FAIL status={status} missing={failed}")
        print(json.dumps({
            "plugin_active": data.get("plugin_active"),
            "plugin_version": data.get("plugin_version"),
            "lang": data.get("lang"),
            "sandbox": data.get("sandbox"),
            "api_email_set": data.get("api_email_set"),
            "api_key_set": data.get("api_key_set"),
            "company_id_set": data.get("company_id_set"),
            "defaults_applied": data.get("defaults_applied"),
        }, ensure_ascii=False, indent=2))
        if not allow_without and (not data.get("api_email_set") or not data.get("api_key_set")):
            print()
            print("BLOCKED: API credentials not set in Woo SuperFaktúra.")
            print("  1) Register/login: https://moja.superfaktura.sk/")
            print("  2) Tools → API → copy email + key (+ company id)")
            print("  3) https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=superfaktura")
            print("  4) Test API connection → re-run this script")
            print("  Docs: docs/reference/superfaktura-api-pattern.md")
            print()
            print("Infra-only (plugin+defaults) while waiting:")
            print("  ALLOW_WITHOUT_API=1 ./scripts/smoke-superfaktura-30.sh")
        sys.exit(2)

    ok += 1
    print(f"[{i}/{iterations}] OK plugin={data.get('plugin_version')} api_email={data.get('api_email_set')} api_key={data.get('api_key_set')}")
    if sleep_s:
        time.sleep(sleep_s)

print()
print(f"SUMMARY: {ok}/{iterations} PASS")
if first:
    print("invoice_rules:", json.dumps(first.get("invoice_rules"), ensure_ascii=False))
    print("settings_url:", first.get("settings_url"))
if allow_without and not (first or {}).get("api_key_set"):
    print()
    print("NOTE: ran with ALLOW_WITHOUT_API=1 — full green requires API keys in Woo.")
    print("BACS proforma smoke (1×): create test order → status on-hold → check SF for proforma.")
    print("  See docs/SUPERFAKTURA_SETUP.md §5")
sys.exit(0)
PY
