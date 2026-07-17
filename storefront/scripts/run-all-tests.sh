#!/usr/bin/env bash
# Spustí všetky relevantné testy GrowMedica storefront ZA SEBOU.
# Bez lokálneho WordPressu (mock + live www).
#
# Usage:
#   cd storefront && yarn test:all
#   cd storefront && bash scripts/run-all-tests.sh
#   SKIP_LIVE=1 yarn test:all          # bez produkčných live testov
#   SKIP_IPHONE=1 yarn test:all        # bez 62 iPhone live testov
#   FAIL_FAST=1 yarn test:all          # zastav pri prvej chybe

set -u
cd "$(dirname "$0")/.."

RED=$'\033[0;31m'
GRN=$'\033[0;32m'
YLW=$'\033[1;33m'
BLU=$'\033[0;34m'
NC=$'\033[0m'

FAIL_FAST="${FAIL_FAST:-0}"
SKIP_LIVE="${SKIP_LIVE:-0}"
SKIP_IPHONE="${SKIP_IPHONE:-0}"

passed=0
failed=0
skipped=0
declare -a RESULTS=()

run_step() {
  local name="$1"
  shift
  echo ""
  echo "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${BLU}▶ $name${NC}"
  echo "${BLU}  $*${NC}"
  echo "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if "$@"; then
    echo "${GRN}✓ PASS — $name${NC}"
    RESULTS+=("PASS|$name")
    passed=$((passed + 1))
    return 0
  else
    echo "${RED}✗ FAIL — $name${NC}"
    RESULTS+=("FAIL|$name")
    failed=$((failed + 1))
    if [[ "$FAIL_FAST" == "1" ]]; then
      echo "${RED}FAIL_FAST=1 — ukončujem.${NC}"
      print_summary
      exit 1
    fi
    return 1
  fi
}

skip_step() {
  local name="$1"
  echo "${YLW}⊘ SKIP — $name${NC}"
  RESULTS+=("SKIP|$name")
  skipped=$((skipped + 1))
}

print_summary() {
  echo ""
  echo "${BLU}════════════════════ SUMMARY ════════════════════${NC}"
  for r in "${RESULTS[@]}"; do
    local status="${r%%|*}"
    local name="${r#*|}"
    case "$status" in
      PASS) echo "${GRN}  ✓ $name${NC}" ;;
      FAIL) echo "${RED}  ✗ $name${NC}" ;;
      SKIP) echo "${YLW}  ⊘ $name${NC}" ;;
    esac
  done
  echo ""
  echo "Passed: $passed | Failed: $failed | Skipped: $skipped"
  if [[ "$failed" -gt 0 ]]; then
    echo "${RED}RESULT: FAILED${NC}"
  else
    echo "${GRN}RESULT: ALL GREEN${NC}"
  fi
}

echo "${BLU}GrowMedica — full test suite (sequential)${NC}"
echo "cwd: $(pwd)"
echo "FAIL_FAST=$FAIL_FAST SKIP_LIVE=$SKIP_LIVE SKIP_IPHONE=$SKIP_IPHONE"
date

# ── 1. Static ──────────────────────────────────────────────────────────────
run_step "type-check" yarn type-check || true

# ── 2. Unit (Node) ─────────────────────────────────────────────────────────
run_step "shopify-admin unit" yarn test:shopify-admin || true

# ── 3. Fast integrity (no browser heavy) ───────────────────────────────────
run_step "unit-integrity (seo/copy/i18n/cart-id)" yarn test:unit-integrity || true
run_step "seo integrity" yarn test:seo || true

# ── 4. Full mock integrity suite ───────────────────────────────────────────
run_step "integrity (mock desktop)" yarn test:integrity || true

# ── 5. Woo mock integrity ──────────────────────────────────────────────────
run_step "woo integrity (mock)" yarn test:woo:integrity || true

# ── 6. i18n + dashboard agent mock ─────────────────────────────────────────
run_step "i18n middleware" yarn test:i18n || true
run_step "dashboard-agent mock" yarn test:dashboard-agent || true

# ── 7. E2E mock ────────────────────────────────────────────────────────────
run_step "e2e shop (mock)" yarn test:e2e || true

# ── 8. iPhone mock layout ──────────────────────────────────────────────────
run_step "integrity iphone mock layout" yarn test:integrity:iphone:mock || true

# ── 9. Live production (optional) ──────────────────────────────────────────
if [[ "$SKIP_LIVE" == "1" ]]; then
  skip_step "e2e live (SKIP_LIVE=1)"
  skip_step "production smoke (SKIP_LIVE=1)"
else
  run_step "e2e live www→cms" yarn test:e2e:live || true
  run_step "production smoke" env PREVIEW_URL=https://www.growmedica.cz yarn production:smoke || true
fi

if [[ "$SKIP_IPHONE" == "1" || "$SKIP_LIVE" == "1" ]]; then
  skip_step "integrity iphone live 300+ (SKIP)"
else
  run_step "integrity iphone live (300+ products, all iPhone sizes)" yarn test:integrity:iphone || true
fi

print_summary
[[ "$failed" -eq 0 ]]
exit $?
