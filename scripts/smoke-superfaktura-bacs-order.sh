#!/usr/bin/env bash
# BACS SuperFaktúra smoke: create order → on-hold (proforma) → processing (regular) → cancel.
#
# Prerequisites: API credentials set (api_email_set + api_key_set on sf-status).
#
# Usage:
#   source ./scripts/load-wp-prod-env.sh
#   ./scripts/smoke-superfaktura-bacs-order.sh
#
# Optional:
#   PRODUCT_ID=123   # Woo product id (default: first published simple product)
#   KEEP_ORDER=1     # do not cancel at end
#
# Docs: docs/SUPERFAKTURA_SETUP.md · reports/SUPERFAKTURA_GO_LIVE_VERIFY.md

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/load-wp-prod-env.sh"

CMS_URL="${WORDPRESS_BASE_URL%/}"
USER="${WORDPRESS_ADMIN_USER:-}"
PASS="${WORDPRESS_APP_PASSWORD:-${WORDPRESS_APPLICATION_PASSWORD:-}}"
CK="${WOO_CONSUMER_KEY:-}"
CS="${WOO_CONSUMER_SECRET:-}"
PRODUCT_ID="${PRODUCT_ID:-}"
KEEP_ORDER="${KEEP_ORDER:-0}"
WAIT_SECS="${WAIT_SECS:-25}"

if [[ -z "$USER" || -z "$PASS" || -z "$CK" || -z "$CS" ]]; then
  echo "ERROR: need WORDPRESS_ADMIN_USER, WORDPRESS_APP_PASSWORD, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET"
  exit 1
fi

python3 - "$CMS_URL" "$USER" "$PASS" "$CK" "$CS" "$PRODUCT_ID" "$KEEP_ORDER" "$WAIT_SECS" <<'PY'
import base64, json, sys, time, urllib.parse, urllib.request, urllib.error

base, user, password, ck, cs, product_id, keep, wait_s = sys.argv[1:9]
keep = keep == "1"
wait_s = int(wait_s)
auth = base64.b64encode(f"{user}:{password}".encode()).decode()
q = urllib.parse.urlencode({"consumer_key": ck, "consumer_secret": cs})

def req(url, method="GET", payload=None, headers=None, timeout=90):
    h = {"Accept": "application/json", "User-Agent": "growmedica-sf-bacs-smoke"}
    if headers:
        h.update(headers)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            body = json.loads(raw) if raw else {}
        except Exception:
            body = {"raw": raw[:800]}
        return e.code, body

def woo(path, method="GET", payload=None):
    sep = "&" if "?" in path else "?"
    return req(f"{base}/wp-json/wc/v3{path}{sep}{q}", method=method, payload=payload)

def sf_status():
    return req(
        f"{base}/wp-json/growmedica/v1/sf-status",
        headers={"Authorization": f"Basic {auth}"},
    )

st, status = sf_status()
print("=== sf-status ===")
print(json.dumps({
    k: status.get(k) for k in (
        "plugin_active", "plugin_version", "lang", "sandbox",
        "api_email_set", "api_key_set", "company_id_set", "defaults_applied",
        "invoice_rules",
    )
} if isinstance(status, dict) else status, indent=2, ensure_ascii=False))

if st != 200 or not isinstance(status, dict):
    raise SystemExit(f"sf-status failed: {st}")
if not status.get("api_email_set") or not status.get("api_key_set"):
    raise SystemExit(
        "BLOCKED: API credentials not set. Owner: majitel.md 2a–2i, or:\n"
        "  SUPERFAKTURA_API_EMAIL=… SUPERFAKTURA_API_KEY=… ./scripts/set-superfaktura-api-from-env.sh"
    )
rules = status.get("invoice_rules") or {}
if rules.get("proforma_bacs") != "on-hold" or rules.get("regular_bacs") != "processing":
    print("WARN: unexpected BACS invoice rules:", rules)

pid = product_id.strip()
if not pid:
    st, products = woo("/products?status=publish&per_page=5&type=simple")
    if st != 200 or not products:
        raise SystemExit(f"No products: {st} {products}")
    pid = str(products[0]["id"])
    print(f"Using product_id={pid} ({products[0].get('name')})")

order_payload = {
    "payment_method": "bacs",
    "payment_method_title": "Bankový prevod",
    "set_paid": False,
    "status": "on-hold",
    "billing": {
        "first_name": "SF",
        "last_name": "Smoke",
        "company": "GrowMedica SF Test",
        "address_1": "Bellova 3455 / 6",
        "city": "Košice - Staré Mesto",
        "postcode": "040 01",
        "country": "SK",
        "email": "info@growmedica.cz",
        "phone": "",
    },
    "shipping": {
        "first_name": "SF",
        "last_name": "Smoke",
        "address_1": "Bellova 3455 / 6",
        "city": "Košice - Staré Mesto",
        "postcode": "040 01",
        "country": "SK",
    },
    "line_items": [{"product_id": int(pid), "quantity": 1}],
    "meta_data": [
        {"key": "_growmedica_sf_smoke", "value": "1"},
    ],
}

st, order = woo("/orders", "POST", order_payload)
if st not in (200, 201) or not isinstance(order, dict) or not order.get("id"):
    raise SystemExit(f"Create order failed: {st} {order}")

oid = order["id"]
print(f"Created order #{oid} status={order.get('status')}")

def meta_map(o):
    return {m.get("key"): m.get("value") for m in (o.get("meta_data") or []) if isinstance(m, dict)}

def refresh():
    return woo(f"/orders/{oid}")

print(f"Waiting {wait_s}s for proforma…")
time.sleep(wait_s)
st, order = refresh()
meta = meta_map(order)
proforma_id = meta.get("wc_sf_internal_proforma_id") or meta.get("wc_sf_invoice_proforma")
print("=== after on-hold ===")
print(json.dumps({
    "status": order.get("status"),
    "wc_sf_internal_proforma_id": meta.get("wc_sf_internal_proforma_id"),
    "wc_sf_invoice_proforma": bool(meta.get("wc_sf_invoice_proforma")),
    "notes_hint": "check order notes in WP if empty",
}, indent=2))

if not meta.get("wc_sf_internal_proforma_id"):
    print("FAIL: no proforma id after on-hold — check SF API / plugin logs / order notes")
    if not keep:
        woo(f"/orders/{oid}", "PUT", {"status": "cancelled"})
        print(f"Cancelled order #{oid}")
    raise SystemExit(1)

st, order = woo(f"/orders/{oid}", "PUT", {"status": "processing"})
print(f"Set processing → HTTP {st} status={order.get('status') if isinstance(order, dict) else '?'}")
print(f"Waiting {wait_s}s for regular invoice…")
time.sleep(wait_s)
st, order = refresh()
meta = meta_map(order)
print("=== after processing ===")
print(json.dumps({
    "status": order.get("status"),
    "wc_sf_internal_proforma_id": meta.get("wc_sf_internal_proforma_id"),
    "wc_sf_internal_regular_id": meta.get("wc_sf_internal_regular_id"),
    "wc_sf_invoice_regular": bool(meta.get("wc_sf_invoice_regular")),
}, indent=2))

ok = bool(meta.get("wc_sf_internal_regular_id"))
if not ok:
    print("FAIL: no regular invoice id after processing")
else:
    print("OK — proforma + regular invoice meta present")
    print("Majiteľ 2k: v SF skontroluj PDF, číslo dokladu, DPH, IBAN, e-mail.")

if not keep:
    woo(f"/orders/{oid}", "PUT", {"status": "cancelled"})
    print(f"Cancelled order #{oid} (KEEP_ORDER=1 to retain)")

raise SystemExit(0 if ok else 1)
PY
