# SEO taxonomy — final status (Codex complete + handoff)

**Branch:** `feat/dashboard-agent-v2`  
**Updated:** 2026-07-17

## Done (production Woo + storefront code)

| Step | Result |
|------|--------|
| Freeze 1.1.0 | 459 READY / 1 HOLD |
| Live taxonomy import | 70 categories created, 459 products updated, 0 errors |
| Post-check dry-run | 75 existing / 0 create / 459 unchanged / 0 update |
| Parent+name category match | WP slug-suffix safe |
| Next redirects | 662 path-only 301 from freeze (+ legacy rules) |
| HOLD legacy URL | middleware 301 → `/produkty/bio-polyporus-…` (not in next.config set) |
| `/kategorie/[...path]` | landings + meta/canonical/robots |
| Sitemap | 460 product + 52 indexable category URLs |
| Unit tests | 14/14 |
| Type-check | OK |
| Isolated build | `NEXT_DIST_DIR=.next-codex` exit 0 |

## Editorial (not live freeze)

`reports/seo-taxonomy/editorial/` — YMYL guidelines, Rank Math SK/CS/EN/DE, sample ~1800-word article i18n. Status `EDITORIAL_REVIEW`.

## Not done

1. **Vercel preview / production deploy** of storefront (needs auth + explicit go)
2. Production SEO smoke on `www.growmedica.cz` after deploy
3. Medical/legal sign-off on editorial pack
4. Domain-level `.sk` → `.cz` if separate from path 301s

## Rollback

- Woo: backup restore or re-assign from pre-import export (do not mass-delete categories blindly)
- Frontend: revert SEO/taxonomy commits (not deployed yet until Vercel)
- HOLD middleware: single hunk in `src/middleware.ts`
