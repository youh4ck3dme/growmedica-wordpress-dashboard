# Vercel deploy — GrowMedica Next.js storefront

Referenčná dokumentácia pre deploy, env workflow a CLI príkazy.

| | |
|---|---|
| **GitHub repo** | `youh4ck3dme/growmedica-nextjs-storefront` |
| **Vercel team** | `h4ck3d` |
| **Vercel project** | `growmedicanextjs` |
| **Production URL** | https://growmedicanextjs.vercel.app |
| **Root Directory** | `storefront` (povinné) |

---

## Required project settings

Next.js app beží v `storefront/`, nie v koreni repozitára (legacy PHP).

**Vercel → Project → Settings → General:**

| Setting | Value |
|---------|--------|
| **Root Directory** | `storefront` |
| **Framework Preset** | Next.js |
| **Package Manager** | Yarn |
| **Install Command** | `yarn install --frozen-lockfile` (z `vercel.json`) |

### Ignored Build Step — NOOR demo branch (growmedicanextjs only)

Branch `feat/noor-production-demo` deployuje NOOR demo výhradne cez projekt **`growmedica-noor-demo`**. Na **`growmedicanextjs`** by inak vznikali zbytočné Preview deploye (`growmedicanextjs-git-feat-noor-production-demo-…`).

**Vercel → growmedicanextjs → Settings → Git → Ignored Build Step:**

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "feat/noor-production-demo" ]; then
  echo "Skipping NOOR demo branch on main Vercel project"
  exit 0
fi

exit 1
```

Alebo (sync s repozitárom):

```bash
bash scripts/vercel-skip-noor-demo-on-main-project.sh
```

Nastaviť cez CLI/API:

```bash
cd storefront
yarn vercel:ignore-noor-demo-on-main   # po vercel login alebo s VERCEL_TOKEN
```

| Projekt | Ignored Build Step | Branch `feat/noor-production-demo` |
|---------|-------------------|--------------------------------------|
| `growmedicanextjs` | **áno** (skip preview) | Preview sa nespustí |
| `growmedica-noor-demo` | **nie** | Production deploy beží normálne |

Nepoužívame `vercel.json` → `git.deploymentEnabled`, lebo oba projekty zdieľajú ten istý súbor v `storefront/`.

Bez **Root Directory = `storefront`** Vercel buildne koreň repa, nenájde `next` v `package.json` a zlyhá.

---

## Team scope (povinné)

Projekt **`growmedicanextjs`** patrí pod team **`h4ck3d`**.

**Nepoužívaj:**
- osobný scope (`youh4ck3dme`)
- team `h4ck3d-labs-projects`

### Prvotné nastavenie CLI

```bash
vercel login
vercel teams switch h4ck3d
cd storefront
vercel link --yes --project growmedicanextjs --scope h4ck3d
```

Po linknutí vznikne `storefront/.vercel/project.json` (gitignored) s `orgId` teamu `h4ck3d`.

Monorepo link na úrovni repa: `.vercel/repo.json` v koreni repozitára (tiež gitignored).

### Všetky CLI príkazy

Ak default team nie je `h4ck3d`, vždy pridaj **`--scope h4ck3d`**:

```bash
vercel env ls --scope h4ck3d
vercel env pull .env.tmp --environment=development --scope h4ck3d --yes
vercel ls growmedicanextjs --scope h4ck3d
vercel redeploy <deployment-url> --target preview --scope h4ck3d
vercel project inspect growmedicanextjs --scope h4ck3d
```

Skripty v repozitári používajú default `VERCEL_SCOPE=h4ck3d` a `VERCEL_PROJECT=growmedicanextjs` (prepísateľné cez env).

### Chyba: „Deployment belongs to a different team“

**Príčina:** CLI beží pod iným scope než projekt (typicky personal account).

**Riešenie:**

```bash
vercel teams switch h4ck3d
# alebo pri každom príkaze:
vercel redeploy <url> --scope h4ck3d
```

---

## Environment variables

Nikdy necommituj reálne hodnoty. V chatoch/logoch reportuj len **PRESENT / MISSING**.

### Povinné premenné

```env
SHOPIFY_STORE_DOMAIN=          # musí končiť .myshopify.com — production: growmedica.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=   # Storefront API token, NIE Admin shpat_
SHOPIFY_REVALIDATION_SECRET=    # min. 16 znakov, custom string, nie shpat_
SHOPIFY_API_VERSION=2025-01
NEXT_PUBLIC_SITE_URL=
```

Legacy `NEXT_PUBLIC_SHOPIFY_*` názvy sú podporované počas migrácie; preferuj `SHOPIFY_*`.

Validácia: `storefront/src/lib/env.ts`.

### Hodnoty podľa prostredia

| Premenná | Production | Preview | Development (local pull) |
|----------|------------|---------|--------------------------|
| `SHOPIFY_*` | rovnaké | rovnaké | rovnaké |
| `NEXT_PUBLIC_SITE_URL` | `https://growmedica.nexify-studio.tech` | `https://growmedica.nexify-studio.tech` | `http://localhost:5555` |

### Preview — globálne vs. branch-scoped

Preview deploye **musia mať všetkých 5 premenných** v targete **Preview**.

| Typ | Scope | Kedy použiť |
|-----|-------|-------------|
| **Globálne Preview** | `Preview` (bez git branch) | Všetky PR / preview deploye — **odporúčané** |
| Branch-scoped | `Preview (feat/…)` | Len ak potrebuješ iné hodnoty pre konkrétny branch |

**Problém, ktorý sme riešili:** Preview env existovalo len pre branch `fix/remove-shopify-hardcoded-secrets`. PR z iných branchov padali na:

```
SHOPIFY_STORE_DOMAIN: Required
SHOPIFY_STOREFRONT_ACCESS_TOKEN: Required
```

**Riešenie:** Nastaviť globálne Preview premenné pre celý projekt (rovnaké hodnoty ako Production).

**Kontrola:**

```bash
cd storefront
vercel env ls preview --scope h4ck3d
vercel env ls production --scope h4ck3d
vercel env ls development --scope h4ck3d
```

Každé prostredie musí mať všetkých 5 premenných (Encrypted).

### Production pull lokálne nefunguje

```bash
# ❌ NEROB — lokálne často vráti prázdne ""
vercel env pull .env.local --environment=production
```

Production/Preview encrypted hodnoty sa cez CLI pull často neprečítajú lokálne. Na lokálny dev používaj **Development** target.

---

## Local `.env.local`

Súbor: `storefront/.env.local` (gitignored). Koreňový `/.env.local` je pre Docker PHP — nie pre Next.js.

### Odporúčaný spôsob — pull z Vercel Development

```bash
cd storefront
vercel teams switch h4ck3d   # ak treba
yarn pull:env
```

Skript `scripts/pull-env-from-vercel.sh`:
- linkne projekt na `h4ck3d/growmedicanextjs` ak chýba `.vercel/project.json`
- stiahne **development** env
- vyčistí Vercel junk z pull súboru
- nastaví `NEXT_PUBLIC_SITE_URL=http://localhost:5555`
- vytvorí zálohu `.env.local.backup.*`
- nevypisuje tokeny (len PRESENT/MISSING)

### Interaktívna alternatíva

```bash
cd storefront
yarn setup:env
```

### Lokálna validácia

```bash
cd storefront
yarn type-check
yarn test:integrity    # 67 testov, Shopify mock mode pre Playwright webServer
SHOPIFY_MOCK_MODE=1 \
SHOPIFY_STORE_DOMAIN=mock-store.myshopify.com \
SHOPIFY_STOREFRONT_ACCESS_TOKEN=mock-storefront-token \
yarn build
```

Build by nemal padať na env validácii ani hlásiť Shopify `401` v sitemap (pri platnom Storefront tokene).

`yarn test:integrity` už nepotrebuje reálne Shopify secrets. Playwright nastaví
pre Next.js test webServer bezpečné mock hodnoty a `SHOPIFY_MOCK_MODE=1`, takže
integrity suite používa deterministické fixture odpovede zo
`src/lib/shopify/mock.ts`.

---

## Deploy workflow

### Production

Automaticky z `main` cez GitHub integráciu → Vercel project `h4ck3d/growmedicanextjs`.

Manuálne (len ak treba):

```bash
cd storefront
vercel --prod --scope h4ck3d
```

### Preview (PR)

Každý PR triggerne preview deploy. Po zmene env premenných treba **redeploy** (nový push alebo manuálne):

```bash
cd storefront
vercel ls growmedicanextjs --scope h4ck3d
vercel redeploy <failed-or-old-preview-url> --target preview --scope h4ck3d
```

**Nepushuj** empty commit len kvôli redeployu, ak stačí `vercel redeploy`.

---

## Troubleshooting

| Symptóm | Príčina | Riešenie |
|---------|---------|----------|
| `Deployment belongs to a different team` | Zlý CLI scope | `vercel teams switch h4ck3d` alebo `--scope h4ck3d` |
| Preview build: `SHOPIFY_* is required` | Chýbajú Preview env vars | Doplň globálne Preview premenné vo Vercel dashboarde / CLI |
| Preview build: `SHOPIFY_STORE_DOMAIN must end with .myshopify.com` | Poškodená hodnota (newline, duplicitné vars) | Zmaž duplicitné Preview vars, znovu nastav čisté hodnoty |
| Lokálny build: prázdne env po `production` pull | Production pull nevracia secrets lokálne | Použi `yarn pull:env` (development) |
| Shopify `401 Unauthorized` pri builde | Zlý Storefront token (Admin `shpat_` namiesto Storefront) | V Shopify Admin vygeneruj **Storefront API** token |
| `read: -p: no coprocess` | Interaktívny snippet v zsh | Použi `yarn setup:env` alebo `yarn pull:env` |

### Redeploy preview — príklad

```bash
vercel teams switch h4ck3d
cd storefront
vercel redeploy growmedicanextjs-XXXXX-h4ck3d.vercel.app \
  --target preview \
  --scope h4ck3d
```

---

## Smoke test (po deployi)

Testuj proti **Vercel deployment URL**, nie `growmedica.sk` ak ešte smeruje na legacy Apache PHP.

```bash
curl -I https://growmedicanextjs.vercel.app
curl -i -X POST "https://growmedicanextjs.vercel.app/api/revalidate" \
  -H "x-revalidation-secret: <secret>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Očakávané: `401` (zlý secret) alebo `200` (platný secret). `302` z Apache = testuješ nesprávny host.

### Aktuálna smoke diagnostika

Posledná diagnostika (2026-06-11) kontrolovala:

- `/`, `/kolekcie`, `/kolekcie/vitaminy-mineraly`, `/produkty`, `/vyhladavanie?q=vitamin`, `/kontakt`
- header, footer, homepage hero
- mega menu otvorenie a 14 kategórií
- 14/14 WebP banner kariet na `/kolekcie`
- popisy kolekcií
- hero banner na detaile kolekcie
- produktový grid
- browser page errors
- B2B Prediction Panel (Admin)

Výsledky:

```text
PR branch smoke: 18/18 PASS
B2B Prediction Panel (Admin): PASS
```

Produkčný fail bol očakávaný: produkcia ešte nemala nové popisy kolekcií z PR #14.
Po merge/deploy PR #14 očakávaj `18/18 PASS`.

Viac detailov: `storefront/docs/DIAGNOSTICS.md`.

---

## Bezpečnosť

- Nikdy necommituj `.env.local`, tokeny, `shpat_*`, PDF/ZIP exporty
- Nikdy necommituj `storefront/.vercel/project.json` ani koreňové `.vercel/repo.json` (obsahujú `projectId` / `orgId` — len lokálne po `vercel link`)
- Integrity test `tests/integrity/vercel-secrets-guard.spec.ts` kontroluje, že tieto súbory nie sú v git indexe ani v histórii
- Nikdy nevypisuj secrets v logoch, PR popisoch ani CI outputoch
- `storefront/.env.local` chmod `600` (nastavuje `pull-env-from-vercel.sh`)
- GitGuardian check na PR — secrets audit musí byť PASS

---

## Súvisiace súbory

| Súbor | Účel |
|-------|------|
| `vercel.json` | Install command, framework |
| `scripts/pull-env-from-vercel.sh` | `yarn pull:env` |
| `scripts/setup-env.sh` | `yarn setup:env` |
| `src/lib/env.ts` | Zod validácia env |
| `.env.example` | Šablóna bez secretov |
