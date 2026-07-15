#!/usr/bin/env bash
# Rýchla priebežná diagnostika — ~30s
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd .. && pwd)"

pass() { echo "✅ $*"; }
fail() { echo "❌ $*"; FAILED=1; }
FAILED=0

echo "══════════════════════════════════════════"
echo " GrowMedica — Quick Diagnostic"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════"

echo ""
echo "── TypeScript ──"
if yarn type-check >/dev/null 2>&1; then pass "yarn type-check"; else fail "yarn type-check"; fi

echo ""
echo "── HTTP Health ──"
WP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/wp-admin/ 2>/dev/null || echo "000")
STORE_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5555/ 2>/dev/null || echo "000")
if [[ "$WP_CODE" == "200" ]]; then pass "WordPress :8080 → $WP_CODE"; else fail "WordPress :8080 → $WP_CODE (spusti setup-wordpress-local.sh)"; fi
if [[ "$STORE_CODE" == "200" ]]; then pass "Storefront :5555 → $STORE_CODE"; else fail "Storefront :5555 → $STORE_CODE (yarn dev)"; fi

echo ""
echo "── WooCommerce REST ──"
if bash scripts/woo-smoke-test.sh >/dev/null 2>&1; then pass "yarn woo:smoke"; else fail "yarn woo:smoke"; fi

echo ""
echo "── Playwright (woo mock) ──"
if CMS_PROVIDER=wordpress WOO_MOCK_MODE=1 yarn playwright test --project=integrity tests/integrity/woo- --reporter=line >/dev/null 2>&1; then
  pass "test:woo:integrity (14 tests)"
else
  fail "test:woo:integrity"
fi

echo ""
echo "── Playwright (unit integrity) ──"
if yarn test:unit-integrity --reporter=line >/dev/null 2>&1; then
  pass "test:unit-integrity"
else
  fail "test:unit-integrity"
fi

echo ""
echo "── Playwright (i18n middleware) ──"
if yarn test:i18n --reporter=line >/dev/null 2>&1; then
  pass "test:i18n"
else
  fail "test:i18n"
fi

if [[ -f "$ROOT/wordpress-credentials.local.env" ]]; then
  echo ""
  echo "── Playwright (live WP) ──"
  if yarn playwright test tests/integrity/wordpress-local.spec.ts --project=integrity --reporter=line >/dev/null 2>&1; then
    pass "test:wordpress:local"
  else
    fail "test:wordpress:local"
  fi
fi

echo ""
echo "══════════════════════════════════════════"
if [[ "$FAILED" -eq 0 ]]; then
  echo "✅ Všetko OK"
  exit 0
else
  echo "⚠️  Niektoré kontroly zlyhali"
  exit 1
fi