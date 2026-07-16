#!/usr/bin/env bash
# Deploy critical GrowMedica CMS snippets via Code Snippets REST API
# (checkout seed multi-SKU, CORS allowlist, ISR revalidate).
#
# Usage:
#   export WORDPRESS_ADMIN_USER='info@growmedica.cz'
#   export WORDPRESS_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx'
#   ./scripts/deploy-cms-snippets.sh
#
# Or source production env (app password, not SSH):
#   set -a; source wordpress-production.local.env; set +a
#   ./scripts/deploy-cms-snippets.sh
#
# Prefer permanent file deploy when SSH is available:
#   scp wordpress/mu-plugins/growmedica-*.php \
#     user@host:growmedica.cz/sub/cms/wp-content/mu-plugins/

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMS_URL="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
CMS_URL="${CMS_URL%/}"
USER="${WORDPRESS_ADMIN_USER:-${WP_ADMIN_USER:-}}"
PASS="${WORDPRESS_APP_PASSWORD:-${WORDPRESS_APPLICATION_PASSWORD:-}}"

if [[ -z "$USER" || -z "$PASS" ]]; then
  echo "ERROR: set WORDPRESS_ADMIN_USER and WORDPRESS_APP_PASSWORD"
  exit 1
fi

python3 - "$ROOT" "$CMS_URL" "$USER" "$PASS" <<'PY'
import json, ssl, sys, base64, urllib.request, urllib.error
from pathlib import Path

root, base, user, password = sys.argv[1:5]
ctx = ssl.create_default_context()
token = base64.b64encode(f"{user}:{password}".encode()).decode()

def rest(path, method="GET", payload=None):
    data = None
    headers = {"Authorization": f"Basic {token}", "User-Agent": "growmedica-deploy-snippets"}
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            body = json.loads(raw) if raw else {}
        except Exception:
            body = {"raw": raw[:500]}
        return e.code, body

def strip_php(path: Path) -> str:
    text = path.read_text()
    if text.startswith("<?php"):
        text = text[5:]
    return text.strip()

checkout = r"""
if (!function_exists('growmedica_parse_gm_cart')) {
  function growmedica_parse_gm_cart($raw) {
    $items = array();
    foreach (array_filter(explode(',', $raw)) as $pair) {
      $parts = explode(':', $pair, 2);
      $product_id = absint($parts[0] ?? 0);
      $qty = max(1, min(99, absint($parts[1] ?? 1)));
      if ($product_id > 0) {
        $items[$product_id] = ($items[$product_id] ?? 0) + $qty;
        if ($items[$product_id] > 99) { $items[$product_id] = 99; }
      }
    }
    return $items;
  }
}

add_action('template_redirect', function () {
  if (empty($_GET['gm_cart']) || !function_exists('WC')) {
    return;
  }
  if (null === WC()->cart) {
    if (function_exists('wc_load_cart')) { wc_load_cart(); }
  }
  if (!WC()->cart) { return; }

  $raw = sanitize_text_field(wp_unslash((string) $_GET['gm_cart']));
  $items = growmedica_parse_gm_cart($raw);
  if ($items === array()) { return; }

  WC()->cart->empty_cart();
  foreach ($items as $product_id => $qty) {
    WC()->cart->add_to_cart($product_id, $qty);
  }

  $to = isset($_GET['gm_to']) ? sanitize_key((string) $_GET['gm_to']) : 'checkout';
  $redirect = $to === 'cart' ? wc_get_cart_url() : wc_get_checkout_url();
  wp_safe_redirect($redirect);
  exit;
}, 5);
""".strip()

isr = r"""
if (!function_exists('growmedica_revalidate_config')) {
  function growmedica_revalidate_config() {
    $secret = getenv('GROWMEDICA_REVALIDATION_SECRET')
      ?: (defined('GROWMEDICA_REVALIDATION_SECRET') ? GROWMEDICA_REVALIDATION_SECRET : '')
      ?: (string) get_option('growmedica_revalidation_secret', '');
    $storefront = getenv('GROWMEDICA_STOREFRONT_URL')
      ?: (defined('GROWMEDICA_STOREFRONT_URL') ? GROWMEDICA_STOREFRONT_URL : '')
      ?: (string) get_option('growmedica_storefront_url', 'https://www.growmedica.cz');
    return array('secret' => $secret, 'storefront' => $storefront);
  }
}
if (!function_exists('growmedica_revalidate_storefront')) {
  function growmedica_revalidate_storefront($tag) {
    $cfg = growmedica_revalidate_config();
    if ($cfg['secret'] === '' || $cfg['storefront'] === '') { return; }
    $url = rtrim($cfg['storefront'], '/') . '/api/revalidate';
    wp_remote_post($url, array(
      'timeout' => 10,
      'blocking' => false,
      'headers' => array(
        'Content-Type' => 'application/json',
        'x-revalidation-secret' => $cfg['secret'],
      ),
      'body' => wp_json_encode(array('tag' => $tag)),
    ));
  }
}
if (!function_exists('growmedica_revalidate_product')) {
  function growmedica_revalidate_product($product_id) {
    $product = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
    if (!$product) { return; }
    $slug = $product->get_slug();
    if ($slug) { growmedica_revalidate_storefront('woo-product-' . $slug); }
    growmedica_revalidate_storefront('woo-products');
  }
}
if (!function_exists('growmedica_revalidate_category')) {
  function growmedica_revalidate_category($term_id) {
    $term = get_term($term_id, 'product_cat');
    if (!$term || is_wp_error($term)) { return; }
    if (!empty($term->slug)) { growmedica_revalidate_storefront('woo-category-' . $term->slug); }
    growmedica_revalidate_storefront('woo-categories');
  }
}
if (!function_exists('growmedica_snippet_revalidate_product')) {
  function growmedica_snippet_revalidate_product($post_id) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) { return; }
    growmedica_revalidate_product((int) $post_id);
  }
}
if (!has_action('save_post_product', 'growmedica_snippet_revalidate_product')) {
  add_action('save_post_product', 'growmedica_snippet_revalidate_product', 20);
}
if (!has_action('edited_product_cat', 'growmedica_revalidate_category')) {
  add_action('edited_product_cat', 'growmedica_revalidate_category', 20);
}
if (!has_action('created_product_cat', 'growmedica_revalidate_category')) {
  add_action('created_product_cat', 'growmedica_revalidate_category', 20);
}
""".strip()

cors = strip_php(Path(root) / "wordpress/mu-plugins/growmedica-cors.php")

desired = [
    {
        "name": "GrowMedica Checkout Seed (gm_cart multi-SKU)",
        "desc": "Seeds Woo cart from ?gm_cart=id:qty,... then redirects to checkout.",
        "code": checkout,
        "tags": ["growmedica", "checkout", "cart"],
        "priority": 5,
    },
    {
        "name": "GrowMedica CORS allowlist",
        "desc": "Store API CORS exact allowlist (no *.vercel.app).",
        "code": cors,
        "tags": ["growmedica", "cors"],
        "priority": 10,
    },
    {
        "name": "GrowMedica ISR revalidate",
        "desc": "Notify storefront /api/revalidate; secret only in header.",
        "code": isr,
        "tags": ["growmedica", "isr"],
        "priority": 10,
    },
]

st, snippets = rest("/wp-json/code-snippets/v1/snippets?per_page=100")
if st != 200 or not isinstance(snippets, list):
    raise SystemExit(f"Cannot list snippets: {st} {snippets}")

by_name = {s.get("name"): s for s in snippets}

for item in desired:
    existing = by_name.get(item["name"])
    payload = {
        **item,
        "scope": "global",
        "active": True,
    }
    if existing:
        st, res = rest(f"/wp-json/code-snippets/v1/snippets/{existing['id']}", "PUT", payload)
        action = "update"
    else:
        st, res = rest("/wp-json/code-snippets/v1/snippets", "POST", payload)
        action = "create"
    sid = res.get("id") if isinstance(res, dict) else None
    active = res.get("active") if isinstance(res, dict) else None
    err = res.get("code_error") if isinstance(res, dict) else None
    print(f"{action:6} id={sid} active={active} err={err} {item['name']}")
    if st >= 400 or err:
        raise SystemExit(f"Failed deploying {item['name']}: {st} {res}")
    if sid and not active:
        st2, res2 = rest(f"/wp-json/code-snippets/v1/snippets/{sid}/activate", "POST")
        print(f"  activate -> {st2} active={res2.get('active') if isinstance(res2, dict) else res2}")

print("OK — snippets deployed")
print("Verify multi-SKU:")
print(f"  curl -sI '{base}/?gm_cart=PRODUCT_ID:1,PRODUCT_ID2:2' | head")
PY
