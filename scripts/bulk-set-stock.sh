#!/usr/bin/env bash
# Bulk-set WooCommerce stock to a fixed quantity (default 100).
#
# Usage:
#   set -a; source wordpress-production.local.env; set +a
#   ./scripts/bulk-set-stock.sh
#   STOCK_QTY=100 ./scripts/bulk-set-stock.sh
#
# Requires: WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET, WORDPRESS_BASE_URL

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STOCK_QTY="${STOCK_QTY:-100}"

if [[ -z "${WOO_CONSUMER_KEY:-}" || -z "${WOO_CONSUMER_SECRET:-}" ]]; then
  if [[ -f "$ROOT/wordpress-production.local.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    # Parse KEY=VALUE safely (values may contain spaces)
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
      key="${line%%=*}"
      val="${line#*=}"
      key="$(echo "$key" | tr -d '[:space:]')"
      export "$key=$val"
    done < "$ROOT/wordpress-production.local.env"
    set +a
  fi
fi

python3 - "$STOCK_QTY" <<'PY'
import json, os, ssl, sys, time, urllib.error, urllib.request
from urllib.parse import urlencode

qty = int(sys.argv[1])
base = os.environ["WORDPRESS_BASE_URL"].rstrip("/")
ck = os.environ["WOO_CONSUMER_KEY"]
cs = os.environ["WOO_CONSUMER_SECRET"]
ctx = ssl.create_default_context()

def woo(path, method="GET", payload=None, params=None):
    q = {"consumer_key": ck, "consumer_secret": cs}
    if params:
        q.update(params)
    url = f"{base}/wp-json/wc/v3{path}?{urlencode(q)}"
    data = None
    headers = {"User-Agent": "growmedica-bulk-stock", "Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, context=ctx, timeout=90) as r:
        raw = r.read().decode()
        headers_out = {k.lower(): v for k, v in r.headers.items()}
        return (json.loads(raw) if raw else {}), headers_out

products = []
page = 1
while True:
    body, h = woo("/products", params={"page": page, "per_page": 100, "status": "publish"})
    batch = body if isinstance(body, list) else []
    if not batch:
        break
    products.extend(batch)
    total_pages = int(h.get("x-wp-totalpages") or "1")
    print(f"listed page {page}/{total_pages} (+{len(batch)})")
    if page >= total_pages:
        break
    page += 1

print(f"total products {len(products)}; target qty={qty}")
updated = 0
ids = [p["id"] for p in products]
for i in range(0, len(ids), 50):
    chunk = ids[i : i + 50]
    payload = {
        "update": [
            {
                "id": pid,
                "manage_stock": True,
                "stock_quantity": qty,
                "stock_status": "instock",
            }
            for pid in chunk
        ]
    }
    body, _ = woo("/products/batch", method="POST", payload=payload)
    upd = body.get("update") if isinstance(body, dict) else []
    ok = sum(1 for u in upd if isinstance(u, dict) and u.get("stock_quantity") == qty)
    updated += ok
    print(f"batch {i // 50 + 1}: ok={ok}/{len(chunk)}")
    time.sleep(0.25)

var_updated = 0
for p in products:
    if p.get("type") != "variable":
        continue
    page = 1
    while True:
        body, h = woo(
            f"/products/{p['id']}/variations",
            params={"page": page, "per_page": 100},
        )
        batch = body if isinstance(body, list) else []
        if not batch:
            break
        payload = {
            "update": [
                {
                    "id": v["id"],
                    "manage_stock": True,
                    "stock_quantity": qty,
                    "stock_status": "instock",
                }
                for v in batch
            ]
        }
        body, _ = woo(
            f"/products/{p['id']}/variations/batch",
            method="POST",
            payload=payload,
        )
        upd = body.get("update") if isinstance(body, dict) else []
        var_updated += len(upd) if isinstance(upd, list) else 0
        total_pages = int(h.get("x-wp-totalpages") or "1")
        if page >= total_pages:
            break
        page += 1

print(f"DONE products≈{updated} variations≈{var_updated}")
PY
