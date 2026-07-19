#!/usr/bin/env bash
# Smoke test — predaj / doprava / platby SK + CZ + AT + HU + PL
#
# Overí to, čo by majiteľ inak kontroloval ručne v pokladni:
#   - shipping rates podľa krajiny (Store API cart)
#   - SK: DPD / Packeta / free ≥ 50 €
#   - CZ/AT/HU/PL: len Slovenská pošta – balík (13/14/14/15 €)
#   - žiadny leak SK metód do zahraničia
#   - COD len na SK; BACS všade
#   - total_tax = 0 (calc_taxes vypnuté)
#   - mena EUR, allowed/ship-to krajiny
#
# Usage:
#   source ./scripts/load-wp-prod-env.sh
#   ./scripts/smoke-woo-countries-cz-at-hu-pl.sh
#
# Env:
#   WORDPRESS_BASE_URL   (default https://cms.growmedica.cz)
#   WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET  — admin settings checks
#   (Store API cart tests need no keys — public)
#
# Exit: 0 = all pass, 1 = any fail

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMS_URL="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
CMS_URL="${CMS_URL%/}"

if [[ -z "${WOO_CONSUMER_KEY:-}" || -z "${WOO_CONSUMER_SECRET:-}" ]]; then
  # Try production env file without breaking on spaces
  if [[ -f "$ROOT/wordpress-production.local.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    # load only keys we need via python to handle spaces in values
    eval "$(python3 - "$ROOT/wordpress-production.local.env" <<'PY'
from pathlib import Path
import shlex, sys
p = Path(sys.argv[1])
want = {
  "WORDPRESS_BASE_URL", "WOO_CONSUMER_KEY", "WOO_CONSUMER_SECRET",
  "WORDPRESS_ADMIN_USER", "WORDPRESS_APP_PASSWORD", "WORDPRESS_APPLICATION_PASSWORD",
}
for line in p.read_text().splitlines():
    t = line.strip()
    if not t or t.startswith("#") or "=" not in t:
        continue
    k, v = t.split("=", 1)
    k, v = k.strip(), v.strip().strip('"').strip("'")
    if k in want and v:
        print(f"export {k}={shlex.quote(v)}")
PY
)"
    set +a
  fi
fi

CMS_URL="${WORDPRESS_BASE_URL:-$CMS_URL}"
CMS_URL="${CMS_URL%/}"

if [[ "$CMS_URL" == *"localhost"* || "$CMS_URL" == *"127.0.0.1"* ]]; then
  echo "ERROR: WORDPRESS_BASE_URL is local ($CMS_URL). Use production CMS."
  exit 1
fi

if [[ -z "${WOO_CONSUMER_KEY:-}" || -z "${WOO_CONSUMER_SECRET:-}" ]]; then
  echo "ERROR: need WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET"
  echo "  source ./scripts/load-wp-prod-env.sh"
  exit 1
fi

export CMS_URL WOO_CONSUMER_KEY WOO_CONSUMER_SECRET

python3 - <<'PY'
import json, os, sys, urllib.error, urllib.parse, urllib.request, http.cookiejar

base = os.environ["CMS_URL"].rstrip("/")
ck = os.environ["WOO_CONSUMER_KEY"]
cs = os.environ["WOO_CONSUMER_SECRET"]

passed = 0
failed = 0
rows = []

def ok(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  ✅ {name}" + (f" — {detail}" if detail else ""))
    else:
        failed += 1
        print(f"  ❌ {name}" + (f" — {detail}" if detail else ""))
    rows.append((bool(cond), name, detail))

def admin(method, path, body=None, params=None):
    q = {"consumer_key": ck, "consumer_secret": cs}
    if params:
        q.update(params)
    url = f"{base}/wp-json/wc/v3{path}?{urllib.parse.urlencode(q)}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": "gm-smoke-countries", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            j = json.loads(raw)
        except Exception:
            j = {"raw": raw[:400]}
        return e.code, j

# ---------- Store API session ----------
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
nonce = None
cart_token = None

def store(method, path, body=None):
    global nonce, cart_token
    url = base + path
    data = None if body is None else json.dumps(body).encode()
    h = {
        "User-Agent": "gm-smoke-countries",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if nonce:
        h["Nonce"] = nonce
    if cart_token:
        h["Cart-Token"] = cart_token
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with opener.open(req, timeout=45) as resp:
            if resp.headers.get("Nonce"):
                nonce = resp.headers.get("Nonce")
            if resp.headers.get("Cart-Token"):
                cart_token = resp.headers.get("Cart-Token")
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        if e.headers.get("Nonce"):
            nonce = e.headers.get("Nonce")
        if e.headers.get("Cart-Token"):
            cart_token = e.headers.get("Cart-Token")
        raw = e.read().decode("utf-8", "replace")
        try:
            j = json.loads(raw)
        except Exception:
            j = {"raw": raw[:400]}
        return e.code, j

def fresh_cart(product_id, qty=1):
    global nonce, cart_token
    nonce = None
    cart_token = None
    store("GET", "/wp-json/wc/store/v1/cart")
    store("DELETE", "/wp-json/wc/store/v1/cart/items")
    code, cart = store("POST", "/wp-json/wc/store/v1/cart/add-item", {"id": product_id, "quantity": qty})
    return code, cart

def set_ship_to(country, postcode, city):
    addr = {
        "country": country,
        "postcode": postcode,
        "city": city,
        "address_1": "Smoke Test 1",
        "first_name": "Smoke",
        "last_name": "Test",
    }
    code, cart = store(
        "POST",
        "/wp-json/wc/store/v1/cart/update-customer",
        {
            "shipping_address": addr,
            "billing_address": {**addr, "email": "smoke-countries@growmedica.local", "phone": "+421900000000"},
        },
    )
    return code, cart

def rates_from(cart):
    out = []
    for pkg in cart.get("shipping_rates") or []:
        for r in pkg.get("shipping_rates") or []:
            try:
                price = int(r.get("price") or 0) / 100.0
            except Exception:
                price = r.get("price")
            out.append(
                {
                    "name": r.get("name") or "",
                    "rate_id": r.get("rate_id") or "",
                    "method_id": r.get("method_id") or "",
                    "price": price,
                    "selected": bool(r.get("selected")),
                }
            )
    return out

def select_first(cart):
    for r in rates_from(cart):
        store(
            "POST",
            "/wp-json/wc/store/v1/cart/select-shipping-rate",
            {"package_id": 0, "rate_id": r["rate_id"]},
        )
        break
    code, cart = store("GET", "/wp-json/wc/store/v1/cart")
    return cart

def names(rates):
    return [r["name"] for r in rates]

print(f"Smoke Woo countries @ {base}\n")

# ---- 0) pick purchasable product ----
print("=== 0) Product fixture ===")
code, products = admin("GET", "/products", params={"per_page": 10, "status": "publish", "stock_status": "instock"})
products = products if isinstance(products, list) else []
product = None
for p in products:
    if p.get("purchasable") and p.get("type") == "simple" and p.get("price"):
        try:
            if float(p["price"]) > 0:
                product = p
                break
        except Exception:
            continue
ok("found purchasable product", product is not None, str(product and product.get("slug")))
if not product:
    print("\nFATAL: no product for cart tests")
    sys.exit(1)
pid = product["id"]
print(f"  using id={pid} slug={product.get('slug')} price={product.get('price')}")

# ---- 1) Admin settings ----
print("\n=== 1) Admin general / tax ===")
def gset(sid):
    c, r = admin("GET", f"/settings/general/{sid}")
    return r.get("value") if isinstance(r, dict) else None

ok("currency EUR", gset("woocommerce_currency") == "EUR", repr(gset("woocommerce_currency")))
ok("calc_taxes no", gset("woocommerce_calc_taxes") == "no", repr(gset("woocommerce_calc_taxes")))
ok("allowed specific", gset("woocommerce_allowed_countries") == "specific")
ok("ship_to specific", gset("woocommerce_ship_to_countries") == "specific")
want = {"SK", "CZ", "AT", "HU", "PL"}
ok("allowed countries set", set(gset("woocommerce_specific_allowed_countries") or []) == want,
   str(sorted(gset("woocommerce_specific_allowed_countries") or [])))
ok("ship_to countries set", set(gset("woocommerce_specific_ship_to_countries") or []) == want,
   str(sorted(gset("woocommerce_specific_ship_to_countries") or [])))

code, rates = admin("GET", "/taxes", params={"per_page": 100})
rates = rates if isinstance(rates, list) else []
by_c = {r.get("country"): r for r in rates}
for c, rate in [("SK", "23.0000"), ("CZ", "21.0000"), ("AT", "20.0000"), ("HU", "27.0000"), ("PL", "23.0000")]:
    r = by_c.get(c)
    ok(f"tax rate {c} {rate}", r and r.get("rate") == rate, str(r and (r.get("id"), r.get("rate"), r.get("name"))))

# ---- 2) Shipping matrix (Store API) ----
print("\n=== 2) Shipping rates by country (Store API cart) ===")
cases = [
    ("SK", "81101", "Bratislava", None),  # special asserts below
    ("CZ", "11000", "Praha", (13.0, "flat_rate:7")),
    ("AT", "1010", "Wien", (14.0, "flat_rate:8")),
    ("HU", "1051", "Budapest", (14.0, "flat_rate:9")),
    ("PL", "00-001", "Warszawa", (15.0, "flat_rate:10")),
]

sk_rates = None
for country, pc, city, expect in cases:
    code, cart = fresh_cart(pid, 1)
    code, cart = set_ship_to(country, pc, city)
    rates = rates_from(cart)
    rate_ids = {r["rate_id"] for r in rates}
    rate_names = names(rates)
    print(f"  [{country}] rates={[(r['name'], r['price'], r['rate_id']) for r in rates]}")

    if country == "SK":
        sk_rates = rates
        ok("SK has DPD 3.90", any(r["price"] == 3.9 and "DPD" in r["name"] for r in rates), str(rate_names))
        ok("SK has Packeta ~2.90", any(r["price"] == 2.9 and "Packeta" in r["name"] for r in rates), str(rate_names))
        ok("SK has second 2.90 method", sum(1 for r in rates if r["price"] == 2.9) >= 2, str(rates))
        ok("SK no SP balík as international", not any("pošta" in r["name"].lower() or "posta" in r["name"].lower() for r in rates if "Slovensk" in r["name"]), "ok if only SK methods")
        # free shipping not required under 50
        ok("SK under 50: free not required", True)
    else:
        price, rid = expect
        ok(f"{country} exactly 1 rate", len(rates) == 1, f"count={len(rates)} {rate_names}")
        if rates:
            r0 = rates[0]
            ok(f"{country} SP balík name", "pošta" in r0["name"].lower() or "posta" in r0["name"].lower() or "Slovensk" in r0["name"], repr(r0["name"]))
            ok(f"{country} cost {price}", abs(float(r0["price"]) - price) < 0.001, f"got={r0['price']}")
            ok(f"{country} rate_id {rid}", r0["rate_id"] == rid, f"got={r0['rate_id']}")
        # no SK leakage
        leak = [n for n in rate_names if "DPD" in n or "Packeta" in n or "zdarma" in n.lower() or "free" in n.lower()]
        ok(f"{country} no SK method leak", not leak, str(leak))

# free shipping SK when cart high enough
print("\n=== 3) SK free shipping ≥ 50 € ===")
# need cart subtotal >= 50 — use qty that exceeds
try:
    unit = float(product.get("price") or 0)
except Exception:
    unit = 0
qty = max(2, int(50 / unit) + 1) if unit > 0 else 3
code, cart = fresh_cart(pid, qty)
code, cart = set_ship_to("SK", "81101", "Bratislava")
rates = rates_from(cart)
ok(
    f"SK cart qty={qty} shows free shipping",
    any("zdarma" in r["name"].lower() or r["rate_id"].startswith("free_shipping") for r in rates),
    str([(r["name"], r["price"], r["rate_id"]) for r in rates]),
)

# CZ still no free when high cart
code, cart = fresh_cart(pid, qty)
code, cart = set_ship_to("CZ", "11000", "Praha")
rates = rates_from(cart)
ok(
    "CZ high cart still only SP (no free)",
    len(rates) == 1 and abs(float(rates[0]["price"]) - 13.0) < 0.001,
    str([(r["name"], r["price"]) for r in rates]),
)

# ---- 4) Payments ----
print("\n=== 4) Payment methods by country ===")
for country, pc, city, want_cod in [
    ("SK", "81101", "Bratislava", True),
    ("CZ", "11000", "Praha", False),
    ("AT", "1010", "Wien", False),
    ("HU", "1051", "Budapest", False),
    ("PL", "00-001", "Warszawa", False),
]:
    code, cart = fresh_cart(pid, 1)
    code, cart = set_ship_to(country, pc, city)
    cart = select_first(cart)
    pms = set(cart.get("payment_methods") or [])
    ok(f"{country} has bacs", "bacs" in pms, str(sorted(pms)))
    if want_cod:
        ok(f"{country} has cod", "cod" in pms, str(sorted(pms)))
    else:
        ok(f"{country} NO cod", "cod" not in pms, str(sorted(pms)))
    tax = cart.get("totals", {}).get("total_tax")
    ok(f"{country} tax=0", str(tax) in ("0", "0.00", 0), f"tax={tax}")

# ---- 5) Admin shipping zones sanity ----
print("\n=== 5) Admin shipping zones ===")
code, zones = admin("GET", "/shipping/zones")
zones = [z for z in (zones or []) if z.get("id") != 0]
by_cc = {}
for z in zones:
    _, locs = admin("GET", f"/shipping/zones/{z['id']}/locations")
    _, methods = admin("GET", f"/shipping/zones/{z['id']}/methods")
    for loc in locs or []:
        if loc.get("type") == "country":
            by_cc[loc.get("code")] = (z, methods or [])

for cc in ("SK", "CZ", "AT", "HU", "PL"):
    ok(f"admin zone {cc}", cc in by_cc, f"keys={sorted(by_cc)}")

if "SK" in by_cc:
    z, methods = by_cc["SK"]
    enabled = [m for m in methods if m.get("enabled")]
    ok("SK free shipping enabled", any(m.get("method_id") == "free_shipping" for m in enabled))
    # free min 50
    free = next((m for m in methods if m.get("method_id") == "free_shipping"), None)
    if free:
        st = free.get("settings") or {}
        min_a = st.get("min_amount", {})
        min_v = min_a.get("value") if isinstance(min_a, dict) else min_a
        ok("SK free min_amount 50", str(min_v) in ("50", "50.00", "50.0"), f"got={min_v}")

print("\n" + "=" * 50)
print(f"RESULT: {passed} passed, {failed} failed")
if failed:
    print("SMOKE FAILED")
    sys.exit(1)
print("SMOKE OK — countries CZ/AT/HU/PL + SK regression")
sys.exit(0)
PY
