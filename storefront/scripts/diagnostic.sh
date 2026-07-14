#!/usr/bin/env bash
# GrowMedica storefront — readonly diagnostic scan
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/.."

echo "GrowMedica diagnostic scan"
echo "=========================="

echo ""
echo "Git:"
git log -1 --oneline
git status -sb
git branch -a | head -10

echo ""
echo "Environment:"
node --version
yarn --version

echo ""
echo "PWA files:"
test -f storefront/public/manifest.webmanifest && echo "  manifest.webmanifest: OK" || echo "  manifest.webmanifest: MISSING"
test -f storefront/public/offline.html && echo "  offline.html: OK" || echo "  offline.html: MISSING"
test -f storefront/src/app/sw.ts && echo "  src/app/sw.ts: OK" || echo "  src/app/sw.ts: MISSING"

cd storefront

echo ""
echo "Type check:"
yarn type-check

echo ""
echo "Lint:"
yarn lint

echo ""
echo "Production:"
curl -s -o /dev/null -w "  homepage: %{http_code}\n" -I https://growmedicanextjs.vercel.app
curl -s -o /dev/null -w "  manifest: %{http_code}\n" -I https://growmedicanextjs.vercel.app/manifest.webmanifest

echo ""
echo "Done."
