# Agent handoff — taxonomy dry-run unblocked (2026-07-17)

## Root cause of 401

| Source | Host | Result |
|--------|------|--------|
| `storefront/.env.local` | `http://localhost:8080` | Connection refused / wrong for live |
| Override only `WORDPRESS_BASE_URL=https://cms.growmedica.cz` but keep local WOO keys | cms | **401** `woocommerce_rest_cannot_view` |
| `wordpress-production.local.env` WOO_* + cms host | cms | **200** · 460–557 products visible |

`loadEnvLocal()` only fills **missing** env keys. Export **all three** before run:
`WORDPRESS_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET` from production file.

## One-liner (no secret echo)

```bash
./scripts/run-taxonomy-dry-run.sh                 # taxonomy-only --dry-run
./scripts/run-taxonomy-dry-run.sh --preflight-only
```

## Freeze gate — verified PASS

- JSON sha256: `188f827fb8616f77daf325d1d0fa8a10a9fee6741d46e664f5678bec84ed3599`
- READY **459** / HOLD **1**
- HOLD handle: `bio-polyporus-prasok-100g-odvodhuje-organizmus`

## Live Woo vs READY (read-only)

| Metric | Value |
|--------|------:|
| Woo products (`status=any`) | **557** |
| READY handles found by slug | **459 / 459** (0 missing) |
| Current Woo categories | **34** (all flat, `parent=0`) |
| Taxonomy categories | **213** |

## Dry-run result (already executed, exit 0)

```json
{
  "mode": "taxonomy-only",
  "dryRun": true,
  "ready": 459,
  "hold": 1,
  "wooProductsFound": 557,
  "categoriesRequired": 75,
  "categoriesExisting": 5,
  "categoriesWouldCreate": 70,
  "productsWouldUpdate": 459,
  "errors": 0
}
```

Full item list: `storefront/IMPORT_SHOPIFY_TO_WOO_REPORT.json` (gitignored? check — may contain handles only).

## Safe next step for Codex

1. **Do not** re-debug 401 — use `./scripts/run-taxonomy-dry-run.sh`.
2. Review report: 70 new hierarchical categories + 459 product category updates.
3. Live write **only after** explicit human OK:
   ```bash
   # same env loading as dry-run, WITHOUT --dry-run
   # node scripts/import-shopify-to-woo.mjs --taxonomy-only
   ```
4. Still out of scope: Shopify content re-import, redirects, SEO/menu.

## Files added for speed

| File | Purpose |
|------|---------|
| `scripts/run-taxonomy-dry-run.sh` | correct env + dry-run |
| `reports/seo-taxonomy/WOO_PREFLIGHT_HINT.json` | credential probe summary (no secrets) |
| `reports/seo-taxonomy/TAXONOMY_COVERAGE.json` | READY↔Woo slug coverage |
| `reports/seo-taxonomy/AGENT_HANDOFF.md` | this file |


## Post-check GREEN (live)

Invariant after parent+name match fix:

- categoriesExisting **75** / wouldCreate **0**
- productsUnchanged **459** / wouldUpdate **0**
- errors **0**

Live write already applied earlier (70 creates + 459 updates). Do not re-run live taxonomy write.

## Redirects

See `REDIRECT_HANDOFF.md` + `redirects.product-only.paths.json`.
**Do not** use raw `/sk/kategorie/*` targets on current storefront.
