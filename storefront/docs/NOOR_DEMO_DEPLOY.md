# NOOR demo deploy

Izolovaný NOOR skin pre GrowMedica — samostatný Vercel projekt a branch, bez vplyvu na hlavnú produkciu.

## Projekty

| | Main produkcia | NOOR demo |
|---|---|---|
| **Vercel project** | `growmedicanextjs` | `growmedica-noor-demo` |
| **Git branch** | `main` | `feat/noor-production-demo` |
| **Production URL** | https://growmedicanextjs.vercel.app | https://growmedica-noor-demo.vercel.app |
| **Custom domain (demo)** | — | `noor.nexify-studio.tech`, `noor.growmedica.cz` (DNS) |
| **Root directory (Vercel)** | `storefront` | `storefront` |

Deploy z **koreňa repozitára** (nie zo `storefront/`), inak Vercel hľadá `storefront/storefront`.

## Preview vs. production — častá chyba vo Verceli

Push na `feat/noor-production-demo` spustí **dva** deploye:

| Čo vidíš vo Verceli | Projekt | Prostredie | URL pattern | Používať? |
|---|---|---|---|---|
| `growmedicanextjs-git-feat-noor-production-demo-…` | `growmedicanextjs` | **Preview** | `growmedicanextjs-*-h4ck3d.vercel.app` | ❌ Nie — môže byť **Stale**, SSO (401), bez NOOR env |
| `growmedica-noor-demo.vercel.app` | `growmedica-noor-demo` | **Production** | fixná demo URL | ✅ Áno — skutočný NOOR demo deploy |

**Stale** na preview znamená len to, že existuje novší deploy na tom istom branchi. **Neovplyvňuje** produkciu `growmedicanextjs.vercel.app` (tam ide len branch `main`).

### Ignored Build Step (growmedicanextjs only)

Na projekte **`growmedicanextjs`** nastav **Settings → Git → Ignored Build Step**, aby branch `feat/noor-production-demo` **nespúšťal Preview deploye** na hlavnom projekte.

**Nenastavuj** toto na **`growmedica-noor-demo`** — tam musí branch `feat/noor-production-demo` naďalej buildovať.

**Prečo nie v `vercel.json`?** Oba Vercel projekty čítajú rovnaký `storefront/vercel.json`. Ak by sme vypli branch v repo configu, prestalo by deployovať aj demo produkcia.

#### Manuálne (Vercel dashboard)

Skopíruj do **Ignored Build Step** na projekte `growmedicanextjs`:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "feat/noor-production-demo" ]; then
  echo "Skipping NOOR demo branch on main Vercel project"
  exit 0
fi

exit 1
```

Semantika Vercel: **exit 0 = preskočiť build**, **exit 1 = pokračovať**.

#### Ignore Build Step

Nastav v Vercel Dashboard (Project → Settings → Git → Ignored Build Step).
One-shot CLI skripty boli odstránené pri project cleanup (2026-07).

**Nezmenené:**
- branch `feat/noor-production-demo` sa nemaže a nemerguje do `main` kvôli preview deployu
- NOOR locked env (`DEFAULT_THEME=noor` + `HIDE=1`) iba na `growmedica-noor-demo`
- main (`growmedicanextjs`): `HIDE=1`, default classic (bez `DEFAULT_THEME=noor`)

## Env premenné

### Main produkcia (`growmedicanextjs`)

Štandardný GrowMedica storefront — **classic** skin, **bez** theme switchera:

- `NEXT_PUBLIC_DEFAULT_THEME` — **nenastavené** (default `classic`)
- `NEXT_PUBLIC_HIDE_THEME_SWITCHER` — **`1`** (skryje Classic/NOOR prepínač; `isThemeLocked()` ignoruje starý `localStorage`)

Zákazník vidí vždy classic. Prepínač ostáva len na NOOR demo projekte (nižšie).

### NOOR demo (`growmedica-noor-demo`)

| Premenná | Hodnota | Účel |
|---|---|---|
| `NEXT_PUBLIC_DEFAULT_THEME` | `noor` | SSR + bootstrap default NOOR skin |
| `NEXT_PUBLIC_HIDE_THEME_SWITCHER` | `1` | Skryje Classic/NOOR prepínač v headeri aj mobile menu |

Keď je `NEXT_PUBLIC_HIDE_THEME_SWITCHER=1`, téma je **locked** (`isThemeLocked`):

- starý `localStorage` kľúč `growmedica-storefront-theme` sa **ignoruje**
- návštevník vždy uvidí default tému projektu (`classic` na main, `noor` na demo)

Ostatné env (Shopify, Mistral, `NEXT_PUBLIC_SITE_URL`) sú rovnaké ako na main, len s demo URL.

## Lokálny vývoj demo skinu

```bash
cd storefront
NEXT_PUBLIC_DEFAULT_THEME=noor NEXT_PUBLIC_HIDE_THEME_SWITCHER=1 yarn dev
```

## Deploy demo

```bash
# z koreňa repozitára
VERCEL_ORG_ID=... VERCEL_PROJECT_ID=prj_yWUommRY7NWsPXDoybAIV5XXFpXG vercel deploy --prod --yes
```

## Testy

```bash
cd storefront
yarn test:noor-demo
```

Overí locked demo režim (NOOR default, ignorovanie `localStorage`, skrytý prepínač).

## Merge do `main`?

PR #23 môže zostať ako **permanentný demo branch** (odporúčané), kým NOOR nebude oficiálny default dizajn GrowMedica.

Merge do `main` iba ak:

- NOOR bude nový produkčný default pre všetkých návštevníkov, a
- na `growmedicanextjs` nastavíte `NEXT_PUBLIC_DEFAULT_THEME=noor` (pri `HIDE=1` ostane switcher skrytý a skin locked na NOOR).
