# NOOR demo deploy

Izolovaný NOOR skin pre GrowMedica — samostatný Vercel projekt a branch, bez vplyvu na hlavnú produkciu.

## Projekty

| | Main produkcia | NOOR demo |
|---|---|---|
| **Vercel project** | `growmedicanextjs` | `growmedica-noor-demo` |
| **Git branch** | `main` | `feat/noor-production-demo` |
| **Production URL** | https://growmedicanextjs.vercel.app | https://growmedica-noor-demo.vercel.app |
| **Custom domain (demo)** | — | `noor.nexify-studio.tech`, `noor.growmedica.sk` (DNS) |
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

#### Cez CLI (odporúčané — script v repozitári)

Rovnaká logika je v `scripts/vercel-skip-noor-demo-on-main-project.sh`. Dashboard môže volať:

```bash
bash scripts/vercel-skip-noor-demo-on-main-project.sh
```

Nastavenie cez API (len `growmedicanextjs`):

```bash
cd storefront
VERCEL_TOKEN=xxx ./scripts/set-growmedicanextjs-ignore-noor-demo-branch.sh
```

Alebo po `vercel login`:

```bash
cd storefront
yarn vercel:ignore-noor-demo-on-main
```

**Nezmenené:**
- env na `growmedicanextjs` (žiadne `NEXT_PUBLIC_DEFAULT_THEME=noor`)
- NOOR locked env iba na `growmedica-noor-demo`
- branch `feat/noor-production-demo` sa nemaže a nemerguje do `main` kvôli preview deployu

## Env premenné

### Main produkcia (`growmedicanextjs`)

Štandardný GrowMedica storefront — **bez** NOOR demo prepínačov:

- `NEXT_PUBLIC_DEFAULT_THEME` — **nenastavené** (default `classic`)
- `NEXT_PUBLIC_HIDE_THEME_SWITCHER` — **nenastavené** (prepínač Classic/NOOR viditeľný)

Používateľ si môže prepnúť tému; voľba sa ukladá do `localStorage` kľúča `growmedica-storefront-theme`.

### NOOR demo (`growmedica-noor-demo`)

| Premenná | Hodnota | Účel |
|---|---|---|
| `NEXT_PUBLIC_DEFAULT_THEME` | `noor` | SSR + bootstrap default NOOR skin |
| `NEXT_PUBLIC_HIDE_THEME_SWITCHER` | `1` | Skryje Classic/NOOR prepínač v headeri aj mobile menu |

Keď sú **obe** premenné nastavené, demo je v **locked** režime:

- starý `localStorage` kľúč `growmedica-storefront-theme` sa **ignoruje**
- návštevník vždy uvidí NOOR skin (aj po predchádzajúcom prepnutí na Classic)

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
- na `growmedicanextjs` **nezapnete** `NEXT_PUBLIC_HIDE_THEME_SWITCHER=1` (pokiaľ nechcete vynútený NOOR aj na main).
