# Deploy audit — 2026-08-04

**Kanónický repo:** [youh4ck3dme/growmedica-wordpress-dashboard](https://github.com/youh4ck3dme/growmedica-wordpress-dashboard)  
**Mirror:** [you640/growmedica-nextjs-2026](https://github.com/you640/growmedica-nextjs-2026)  
**PR sync + CI fix:** [#15 merged](https://github.com/youh4ck3dme/growmedica-wordpress-dashboard/pull/15) → `582b5e3`

## Sync stav

| Zdroj | HEAD | Sync |
|-------|------|------|
| Cloud workspace / `origin/main` | `582b5e3` | synced (PR #15 merged) |
| `you640/main` | `871b21f` | syncnuté do canonical cez PR #15 |
| Mac lokál | neoverené | spusti `git status` + `git log origin/main..HEAD` |

### Commity syncnuté z you640 (PR #15)

- `9d69eac` — gitignore `.env*`, vscode workspace
- `9d443c8` — gitignore `*kluce*.md`, `*.secret.md`
- `871b21f` — pin `@swc/helpers`, Node 22.23, Vercel clean install

## CI / testy

| Check | Stav |
|-------|------|
| Canonical CI (youh4ck3dme) | fix merged v PR #15 (`--experimental-strip-types`) |
| Lokálny smoke (PR branch) | `type-check` OK · `test:unit` 69/69 · `test:woo:integrity` 14/14 |

**Príčina zlyhania:** unit testy importujú `.ts` súbory; Node 22.14 bez `--experimental-strip-types` padá s `ERR_UNKNOWN_FILE_EXTENSION`.

## Produkcia (Vercel smoke)

| Check | Výsledok |
|-------|----------|
| `https://www.growmedica.cz/` | HTTP 200, `server: Vercel` |
| Category departments UX | OK `department` v HTML (feature `94221fe`) |
| `/prihlasenie` | OK WooCommerce BFF (nie MOCK) |
| Presný deploy commit SHA | nie v HTTP headers — overiť vo Vercel dashboarde |
| `x-robots-tag: noindex` | overiť geo/middleware |

**Odhad:** produkcia beží na commite >= `94221fe`. Po merge PR #15 (`582b5e3`) Vercel spustí redeploy s `@swc/helpers` fixom.

## you640 mirror cleanup (ručne — agent nemá write prístup)

```bash
gh pr close 1 --repo you640/growmedica-nextjs-2026 --comment "Stale: merged on canonical."
gh pr close 2 --repo you640/growmedica-nextjs-2026 --comment "Stale: merged on canonical as PR #7."
gh pr close 3 --repo you640/growmedica-nextjs-2026 --comment "Stale: merged on canonical as PR #8."
```

## Odporúčané kroky

1. Merge PR #15 — hotové → `582b5e3`
2. Overiť Vercel Production deployment SHA po redeploy
3. Na Mac: `git fetch origin && git pull` — sync s `origin/main`
4. Zatvoriť stale PR #1–#3 na you640 (príkazy vyššie)
5. Majiteľ: GTM/GA4/Pixel IDs, SuperFaktúra 2a–2j
