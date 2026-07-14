# GrowMedica Storefront Diagnostics

Last updated: 2026-06-11

## Current storefront status

| Area | Status |
|------|--------|
| 14 mega menu WebP banners | PASS |
| Collection index WebP banners | PASS |
| Collection detail hero banners | PASS |
| Collection descriptions | PASS on PR branch |
| TypeScript | PASS |
| Integrity tests (134 tests) | PASS |
| Smoke test | PASS on PR branch |
| Vercel preview check | PASS |
| GitGuardian check | PASS |
| B2B Prediction Panel (Admin) | PASS |


## Live URLs

| Environment | URL | Notes |
|-------------|-----|-------|
| Production | https://growmedicanextjs.vercel.app | Main Vercel production app |
| Domain alias used in diagnostics | https://growmedica.nexify-studio.tech | Smoke-tested production-facing host |
| PR preview | Vercel-generated preview URL | May be protected by Vercel SSO for anonymous browser tests |

## Category / collection banner coverage

All 14 navigable categories map to `.webp` files in:

```text
storefront/public/images/mega-menu/
```

Expected files:

```text
aminokyseliny.webp
detox-pecen.webp
imunita.webp
klby-pohyb.webp
krasa-pokozka.webp
proteiny.webp
regeneracia.webp
spanok-stres.webp
specialna-vyziva.webp
sportova-vyziva.webp
srdce-cievy.webp
travenie.webp
vitaminy-mineraly.webp
zdrave-potraviny.webp
```

The route mapping is centralized in:

```text
storefront/src/lib/mega-menu-banners.ts
```

The category source of truth, including required titles and descriptions, is:

```text
storefront/src/lib/category-map.ts
```

## Validation commands

Run from `storefront/`:

```bash
yarn type-check
yarn test:integrity
SHOPIFY_MOCK_MODE=1 \
SHOPIFY_STORE_DOMAIN=mock-store.myshopify.com \
SHOPIFY_STOREFRONT_ACCESS_TOKEN=mock-storefront-token \
yarn build
```

Latest validated results:

```text
yarn type-check: PASS
yarn test:integrity: PASS — 134/134
SHOPIFY_MOCK_MODE=1 ... yarn build: PASS
```

## Shopify mock mode for tests

`yarn test:integrity` does not require real Shopify secrets.

Playwright starts the Next.js webServer with:

```env
SHOPIFY_MOCK_MODE=1
SHOPIFY_STORE_DOMAIN=mock-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=mock-storefront-token
SHOPIFY_API_VERSION=2025-01
```

When `SHOPIFY_MOCK_MODE=1`, `src/lib/shopify/client.ts` returns deterministic
fixture responses from:

```text
storefront/src/lib/shopify/mock.ts
```

This covers:

- collection navigation
- collection detail pages
- product grids
- featured products
- mega menu featured products
- sitemap-related product/collection handles

Production behavior is unchanged unless `SHOPIFY_MOCK_MODE=1` is explicitly set.

## Smoke test summary

Smoke test coverage:

- `/`
- `/kolekcie`
- `/kolekcie/vitaminy-mineraly`
- `/produkty`
- `/vyhladavanie?q=vitamin`
- `/kontakt`
- homepage hero
- header and footer
- mega menu open state
- 14 category links in mega menu
- 14 collection cards
- visible `.webp` collection banners
- collection descriptions
- collection detail hero banner dimensions
- product grid presence
- browser page errors

Latest PR branch smoke result:

```text
18/18 PASS
```

Measured collection detail hero banner on desktop:

```text
~1216 x 322 px
```

Measured collection cards on desktop:

```text
~387 x 160 px banner area
```

## Production caveat from latest diagnostics

Before PR #14 was merged/deployed, production smoke against
`https://growmedica.nexify-studio.tech` returned:

```text
17/18 PASS
```

The failing check was collection card descriptions, because production still had
the pre-PR state. The current PR branch passed the same check locally:

```text
/kolekcie cards include descriptions: PASS
```

After PR #14 is merged and deployed to production, rerun the smoke test against
the production URL and expect:

```text
18/18 PASS
```

## Chrome DevTools Issues (očakávané správanie)

Pri testovaní checkout flow alebo PWA v Chrome → **Issues** sa môžu objaviť dve
správy. Obe sme overili na živých deployoch (`noor.nexify-studio.tech`,
`growmedicanextjs.vercel.app`).

### 1. Bounce tracking — `growmedica.myshopify.com`

**Správa:** „Chrome may soon delete state for intermediate websites… 1
potentially tracking website: growmedica.myshopify.com“ (historicky aj `tn43yx-0k.myshopify.com` — alias, redirectuje sem)

**Príčina:** Headless storefront presmeruje z `/kosik` priamo na Shopify checkout
URL vrátenú Storefront API (`cart.checkoutUrl`). Doména `*.myshopify.com` je
Shopify-hosted checkout — Chrome ju v reťazci navigácie berie ako medzistránku
bez predchádzajúcej interakcie (bounce tracking mitigation).

**Stav:** Očakávané správanie, nie chyba GrowMedica kódu. Checkout link je v
`InteractiveCart.tsx` (`href={cart.checkoutUrl}`); doména pochádza z Vercel env
`SHOPIFY_STORE_DOMAIN` — **canonical:** `growmedica.myshopify.com` (`tn43yx-0k.myshopify.com` je legacy alias, rovnaký obchod).

**Čo sa nedá jednoducho opraviť:** Bez Shopify Plus / embedded checkoutu alebo
vlastnej platobnej brány vždy existuje redirect na `myshopify.com`. Chrome môže
vymazať cookies/storage tejto medzistránky — checkout stále funguje.

**Čo môže užívateľ urobiť:** Ignorovať warning pri vývoji; pri QA checkoutu
kliknúť „Prejsť k pokladni“ a dokončiť platbu na Shopify stránke.

### 2. Quirks Mode

**Správa:** „Page layout may be unexpected due to Quirks Mode“

**Overenie (2026-06-11):**

| Zdroj | DOCTYPE na byte 0 | UTF-8 BOM |
|-------|-------------------|-----------|
| `/` (Next.js `layout.tsx`) | `<!DOCTYPE html>` | nie |
| `/kosik`, `/offline` | `<!DOCTYPE html>` | nie |
| `public/offline.html` | `<!DOCTYPE html>` | nie |
| Lighthouse audit `doctype` | score 1 (PASS) | — |

Next.js App Router vkladá `<!DOCTYPE html>` automaticky; `layout.tsx` nemusí
obsahovať vlastný DOCTYPE. Statická PWA záloha `offline.html` má platný
DOCTYPE bez BOM.

**Stav:** GrowMedica HTML dokumenty sú v standards mode. Ak warning pretrváva
po návrate z Shopify checkoutu, pravdepodobne sa týka **Shopify checkout
stránky** v reťazci navigácie, nie nášho storefrontu.

**Regresný test:** `yarn test:pwa` — test „HTML dokumenty majú DOCTYPE“.

## Prediktívny monitoring úpadku (B2B Insolvency Panel)

**Dátum integrácie:** 2026-06-11
**Umiestnenie v repozitári `growmedica-nexus`:**
- Výpočtový engine: [b2b-prediction.ts](file:///Users/erikbabcan/Downloads/growmedica-nexus/src/lib/b2b-prediction.ts)
- Administračné rozhranie: [zakaznici.tsx](file:///Users/erikbabcan/Downloads/growmedica-nexus/src/routes/admin/zakaznici.tsx)

### Funkcionalita a metodika výpočtu
- **Priemerné meškanie platieb (DSO):** Vypočítava sa na základe histórie uhradených faktúr a meškania po splatnosti od baseline dátumu (`2026-06-11`).
- **Trendový sklon (Slope):** Vypočítava sa pomocou lineárnej regresie sklonu meškania faktúr. Kladný sklon indikuje zhoršujúcu sa platobnú morálku.
- **Pomer neuhradených faktúr:** Pomer nezaplatenej sumy k celkovej vyfakturovanej sume.
- **Pravdepodobnosť zlyhania (Default Probability):** Skóre (1-99%) počítané z meškania, sklonu trendu a neuhradeného pomeru.
- **Predpoveď platobnej neschopnosti (3-month warning):** Spustí sa, ak je pravdepodobnosť zlyhania > 60%, trend zhoršovania > 3.5 dňa/mesiac a klient má aktívne meškajúce faktúry.

### Užívateľské rozhranie (Dashboard)
- **Štatistické karty:** Počet rizikových klientov, celková suma po splatnosti, priemerný DSO a počet predpovedaných úpadkov o 3 mesiace.
- **Interaktívne záložky a filtre:** Filtrovanie klientov podľa stupňa rizika (LOW, MEDIUM, HIGH) a typu/segmentu.
- **Grafy vývoja meškania:** Vlastné SVG grafy vykresľujúce lineárny trend splatnosti pre každého klienta.
- **Akčný modal detailu:** Detailný prehľad faktúr klienta s možnosťou odoslať upomienku priamo z dashboardu.

## Suggested AI/report response

```text
Smoke test prešiel na aktuálnom PR branchi: 18/18 kontrol úspešných.
Produkcia pred merge/deploy PR #14 ešte neobsahovala posledné popisy kolekcií,
pracuje sa na nasadení. B2B prediction panel úspešne integrovaný do growmedica-nexus.
```
