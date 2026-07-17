#!/usr/bin/env bash
# Install / activate SuperFaktúra WooCommerce on cms.growmedica.cz
# + deploy non-secret defaults snippet + status REST endpoint.
#
# Usage:
#   set -a; source wordpress-production.local.env; set +a
#   export WORDPRESS_BASE_URL=https://cms.growmedica.cz
#   ./scripts/install-superfaktura-cms.sh
#
# Optional:
#   RESET_SF_DEFAULTS=1 ./scripts/install-superfaktura-cms.sh   # re-apply invoice rules
#   SKIP_SNIPPET=1 ./scripts/install-superfaktura-cms.sh        # only install plugin
#
# Secrets (API email/key/company_id) are NEVER set here — configure in WP admin.
# Docs: docs/SUPERFAKTURA_SETUP.md

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMS_URL="${WORDPRESS_BASE_URL:-https://cms.growmedica.cz}"
CMS_URL="${CMS_URL%/}"
USER="${WORDPRESS_ADMIN_USER:-${WP_ADMIN_USER:-}}"
PASS="${WORDPRESS_APP_PASSWORD:-${WORDPRESS_APPLICATION_PASSWORD:-}}"
RESET_DEFAULTS="${RESET_SF_DEFAULTS:-0}"
SKIP_SNIPPET="${SKIP_SNIPPET:-0}"

if [[ "$CMS_URL" == *"localhost"* || "$CMS_URL" == *"127.0.0.1"* ]]; then
  echo "ERROR: WORDPRESS_BASE_URL points to local ($CMS_URL). Use https://cms.growmedica.cz"
  exit 1
fi

if [[ -z "$USER" || -z "$PASS" ]]; then
  echo "ERROR: set WORDPRESS_ADMIN_USER and WORDPRESS_APP_PASSWORD"
  echo "  set -a; source wordpress-production.local.env; set +a"
  exit 1
fi

python3 - "$CMS_URL" "$USER" "$PASS" "$RESET_DEFAULTS" "$SKIP_SNIPPET" <<'PY'
import json, ssl, sys, base64, time, urllib.request, urllib.error, urllib.parse

base, user, password, reset_defaults, skip_snippet = sys.argv[1:6]
reset_defaults = reset_defaults == "1"
skip_snippet = skip_snippet == "1"
ctx = ssl.create_default_context()
token = base64.b64encode(f"{user}:{password}".encode()).decode()
PLUGIN = "woocommerce-superfaktura/woocommerce-superfaktura"
PLUGIN_FILE = "woocommerce-superfaktura/woocommerce-superfaktura.php"
SLUG = "woocommerce-superfaktura"
SNIPPET_NAME = "GrowMedica SuperFaktura defaults"

SNIPPET_CODE = r'''
/**
 * GrowMedica — SuperFaktúra non-secret defaults + status REST.
 * API email/key/company_id: WooCommerce → Settings → SuperFaktúra.
 */
if (!defined('ABSPATH')) { return; }

add_action('init', function () {
	if (get_option('growmedica_sf_defaults_v1') === '1') {
		return;
	}

	update_option('woocommerce_sf_lang', 'sk');
	update_option('woocommerce_sf_sandbox', 'no');

	update_option('woocommerce_sf_add_company_billing_fields', 'yes');

	update_option('woocommerce_sf_invoice_regular_manual', 'yes');
	update_option('woocommerce_sf_invoice_proforma_manual', 'yes');

	update_option('woocommerce_sf_prevent_concurrency', 'yes');
	update_option('woocommerce_sf_retry_failed_api_calls', 'yes');

	// BACS: proforma on-hold; tax invoice when processing (paid)
	update_option('woocommerce_sf_invoice_proforma_bacs', 'on-hold');
	update_option('woocommerce_sf_invoice_proforma_bacs_set_as_paid', 'no');
	update_option('woocommerce_sf_invoice_regular_bacs', 'processing');
	update_option('woocommerce_sf_invoice_regular_bacs_set_as_paid', 'yes');

	// COD: no proforma; tax invoice on processing (unpaid)
	update_option('woocommerce_sf_invoice_proforma_cod', '0');
	update_option('woocommerce_sf_invoice_proforma_cod_set_as_paid', 'no');
	update_option('woocommerce_sf_invoice_regular_cod', 'processing');
	update_option('woocommerce_sf_invoice_regular_cod_set_as_paid', 'no');

	update_option('woocommerce_sf_invoice_set_as_paid_statuses', array('completed', 'processing'));

	update_option('growmedica_sf_defaults_v1', '1');
	update_option('growmedica_sf_defaults_applied_at', gmdate('c'));
}, 20);

add_action('rest_api_init', function () {
	register_rest_route('growmedica/v1', '/sf-status', array(
		'methods'  => 'GET',
		'permission_callback' => function () {
			return current_user_can('manage_woocommerce') || current_user_can('manage_options');
		},
		'callback' => function () {
			if (!function_exists('is_plugin_active')) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			if (!function_exists('get_plugin_data')) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			$plugin = 'woocommerce-superfaktura/woocommerce-superfaktura.php';
			$ver = '';
			$main = WP_PLUGIN_DIR . '/' . $plugin;
			if (file_exists($main)) {
				$data = get_plugin_data($main, false, false);
				$ver = isset($data['Version']) ? $data['Version'] : '';
			}
			$email = (string) get_option('woocommerce_sf_email', '');
			$key   = (string) get_option('woocommerce_sf_apikey', '');
			$cid   = (string) get_option('woocommerce_sf_company_id', '');
			$at    = strpos($email, '@');
			$hint  = '';
			if ($email !== '') {
				$hint = ($at !== false)
					? (substr($email, 0, 2) . '…' . substr($email, $at))
					: (substr($email, 0, 2) . '…');
			}
			return array(
				'plugin_active'   => is_plugin_active($plugin),
				'plugin_version'  => $ver,
				'lang'            => get_option('woocommerce_sf_lang', ''),
				'sandbox'         => get_option('woocommerce_sf_sandbox', 'no') === 'yes',
				'api_email_set'   => $email !== '',
				'api_email_hint'  => $hint,
				'api_key_set'     => $key !== '',
				'company_id_set'  => $cid !== '',
				'defaults_applied'=> get_option('growmedica_sf_defaults_v1') === '1',
				'defaults_applied_at' => get_option('growmedica_sf_defaults_applied_at', ''),
				'invoice_rules'   => array(
					'proforma_bacs'      => get_option('woocommerce_sf_invoice_proforma_bacs', ''),
					'regular_bacs'       => get_option('woocommerce_sf_invoice_regular_bacs', ''),
					'regular_bacs_paid'  => get_option('woocommerce_sf_invoice_regular_bacs_set_as_paid', ''),
					'proforma_cod'       => get_option('woocommerce_sf_invoice_proforma_cod', ''),
					'regular_cod'        => get_option('woocommerce_sf_invoice_regular_cod', ''),
					'regular_cod_paid'   => get_option('woocommerce_sf_invoice_regular_cod_set_as_paid', ''),
				),
				'settings_url' => admin_url('admin.php?page=wc-settings&tab=superfaktura'),
				'docs'         => 'docs/SUPERFAKTURA_SETUP.md',
			);
		},
	));
});
'''.strip()


def rest(path, method="GET", payload=None, timeout=90):
    data = None
    headers = {
        "Authorization": f"Basic {token}",
        "User-Agent": "growmedica-install-superfaktura",
        "Accept": "application/json",
    }
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            body = json.loads(raw) if raw else {}
        except Exception:
            body = {"raw": raw[:800]}
        return e.code, body


print(f"=== SuperFaktúra on {base} ===")

# Prefer list lookup — single-plugin GET with %2F is 404 on some hosts; bare slash works.
status, plugins = rest("/wp-json/wp/v2/plugins?per_page=100")
body = None
if status == 200 and isinstance(plugins, list):
    for p in plugins:
        if (p.get("plugin") or "").startswith("woocommerce-superfaktura/"):
            body = p
            break

if body:
    print(f"plugin present: v{body.get('version')} status={body.get('status')}")
    if body.get("status") != "active":
        # WP REST accepts unencoded slash in plugin path on this host
        plugin_path = f"/wp-json/wp/v2/plugins/{PLUGIN}"
        st2, b2 = rest(plugin_path, method="POST", payload={"status": "active"})
        print(f"activate -> HTTP {st2} status={b2.get('status') if isinstance(b2, dict) else b2}")
        body = b2 if st2 < 400 else body
else:
    print(f"plugin not found, installing from wordpress.org slug={SLUG} …")
    st, b = rest(
        "/wp-json/wp/v2/plugins",
        method="POST",
        payload={"slug": SLUG, "status": "active"},
        timeout=180,
    )
    print(f"install -> HTTP {st}")
    if st >= 400:
        # folder_exists = already on disk but inactive/broken list race
        if isinstance(b, dict) and b.get("code") == "folder_exists":
            st2, b2 = rest(f"/wp-json/wp/v2/plugins/{PLUGIN}", method="POST", payload={"status": "active"})
            print(f"folder exists, activate -> HTTP {st2} {b2.get('status') if isinstance(b2, dict) else b2}")
            if st2 >= 400:
                print(json.dumps(b2, ensure_ascii=False, indent=2)[:1200])
                sys.exit(1)
            body = b2
        else:
            print(json.dumps(b, ensure_ascii=False, indent=2)[:1200])
            sys.exit(1)
    else:
        body = b
        print(f"installed: v{body.get('version')} status={body.get('status')}")

if not skip_snippet:
    code = SNIPPET_CODE
    if reset_defaults:
        code = "delete_option('growmedica_sf_defaults_v1');\ndelete_option('growmedica_sf_defaults_applied_at');\n" + SNIPPET_CODE
        print("RESET_SF_DEFAULTS=1 — will re-apply invoice rules")

    payload = {
        "name": SNIPPET_NAME,
        "desc": "SuperFaktúra non-secret defaults (BACS/COD) + GET /wp-json/growmedica/v1/sf-status",
        "code": code,
        "scope": "global",
        "active": True,
        "priority": 10,
        "tags": ["growmedica", "superfaktura"],
    }

    st, snippets = rest("/wp-json/code-snippets/v1/snippets?per_page=100")
    if st >= 400:
        print("WARN: cannot list snippets", st, snippets)
    else:
        existing = None
        for s in snippets if isinstance(snippets, list) else []:
            if s.get("name") == SNIPPET_NAME:
                existing = s
                break
        if existing:
            sid = existing["id"]
            st2, b2 = rest(f"/wp-json/code-snippets/v1/snippets/{sid}", method="PUT", payload=payload)
            print(f"snippet update id={sid} -> HTTP {st2} active={b2.get('active') if isinstance(b2, dict) else ''}")
            if st2 >= 400:
                print(json.dumps(b2, ensure_ascii=False, indent=2)[:800])
        else:
            st2, b2 = rest("/wp-json/code-snippets/v1/snippets", method="POST", payload=payload)
            print(f"snippet create -> HTTP {st2} id={b2.get('id') if isinstance(b2, dict) else b2}")
            if st2 >= 400:
                print(json.dumps(b2, ensure_ascii=False, indent=2)[:800])

    # Bootstrap init hooks (options + rest route)
    rest("/wp-json/wp/v2/plugins?per_page=1")
    time.sleep(1)
    st_sf, sf = rest("/wp-json/growmedica/v1/sf-status")
    if st_sf == 404:
        time.sleep(1)
        rest("/wp-json/wp/v2/plugins?per_page=1")
        st_sf, sf = rest("/wp-json/growmedica/v1/sf-status")

    # If we used reset prefix, rewrite snippet to clean code (no permanent delete_option)
    if reset_defaults and st < 400:
        clean_payload = {**payload, "code": SNIPPET_CODE}
        st_list, snippets2 = rest("/wp-json/code-snippets/v1/snippets?per_page=100")
        for s in snippets2 if isinstance(snippets2, list) else []:
            if s.get("name") == SNIPPET_NAME:
                rest(f"/wp-json/code-snippets/v1/snippets/{s['id']}", method="PUT", payload=clean_payload)
                print("snippet restored to clean code (no reset prefix)")
                break

    print(f"sf-status HTTP {st_sf}")
    if st_sf < 400 and isinstance(sf, dict):
        print(json.dumps(sf, ensure_ascii=False, indent=2))
        if not sf.get("api_key_set"):
            print("\nNEXT: set API Email + API Key + Company ID in:")
            print("  ", sf.get("settings_url") or (base + "/wp-admin/admin.php?page=wc-settings&tab=superfaktura"))
            print("  See docs/SUPERFAKTURA_SETUP.md")
    else:
        print("sf-status body:", sf)

print("=== done ===")
PY
