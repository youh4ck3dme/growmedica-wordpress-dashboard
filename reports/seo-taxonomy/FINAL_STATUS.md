# SEO taxonomy — final status (2026-07-17)

## Pipeline (completed)

| Step | Result |
|------|--------|
| Freeze 1.1.0 | READY 459 / HOLD 1 / SHA locked |
| Taxonomy-only live Woo | 70 categories created, 459 products updated, 0 errors |
| Post-check | 75 existing / 0 create / 459 unchanged / 0 update |
| Parent+name match | fixes WP term slug suffixes |
| Storefront `/kategorie/[...path]` | landing + SEO robots/canonical |
| Path-only redirects | host-independent; locale prefix stripped on destination |
| HOLD skip | no PDP redirect for hold handle |
| Isolated build | `NEXT_DIST_DIR=.next-codex` avoids concurrent dev cache |

## HTTP smoke (local `next start` on `.next-codex`)

| Check | Result |
|-------|--------|
| Legacy product URL | **301** → `/produkty/mycomedica-bio-coriolus-100-g` |
| Legacy category URL | **301** → `/kategorie/balicky-zdravia` |
| `/kategorie/doplnky-vyzivy` | **200** |
| Sitemap `/produkty/` | **460** URLs |
| Sitemap `/kategorie/` | **52** URLs |
| routes-manifest SEO redirects | **662 × 301** (+ 17 legacy `permanent` as 308) |

## Not done (needs human / deploy)

- Vercel production deploy
- Domain-level `.sk` → `.cz` if separate from path redirects
- Editorial/medical SEO copy approval
- HOLD product decision reverse (optional)
