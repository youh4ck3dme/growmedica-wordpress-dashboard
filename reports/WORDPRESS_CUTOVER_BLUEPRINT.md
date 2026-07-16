# Blueprint: Cutover na WordPress/Woo — zrušenie Shopify

**Projekt:** GrowMedica (`growmedica-wordpress-dashboard`)  
**Cieľ:** `CMS_PROVIDER=wordpress` na produkcii; Shopify neskôr zrušiť.  
**Aktualizované:** 2026-07-16  

---

## 1. Cieľová architektúra

```
                    ┌─────────────────────────────────────┐
  Zákazník ────────►│  www.growmedica.cz / growmedica.cz  │
                    │  Next.js 15 (Vercel)                 │
                    │  CMS_PROVIDER=wordpress              │
                    └──────────────┬──────────────────────┘
                                   │ Woo REST v3 + Store API
                                   │ ck_ / cs_ (server-only)
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  cms.growmedica.cz                   │
                    │  WordPress + WooCommerce            │
                    │  produkty, sklad, objednávky        │
                    │  mu-plugins: cors + revalidate      │
                    └─────────────────────────────────────┘

  Shopify ──(dočasne)──► import skript ──► Woo
  Shopify ──(po cutoveri)──► archivácia / zrušenie predplatného
```

| Doména | Rola po cutoveri |
|--------|------------------|
| https://www.growmedica.cz | Verejný shop (Next.js) |
| https://growmedica.cz | Redirect → www (Vercel) |
| https://cms.growmedica.cz | WP Admin + Woo (headless backend) |
| growmedica.myshopify.com | **dočasný** zdroj importu → potom off |

**Nie je potrebné** nastavovať WooCommerce UI „Webhooky“ — ISR ide cez mu-plugin `growmedica-revalidate.php` → `/api/revalidate`.

---

## 2. Stav dnes (baseline)

| Položka | Stav |
|---------|------|
| Next.js produkcia | `CMS_PROVIDER=shopify` (tokenless) |
| Katalóg live | ~460 produktov zo Shopify |
| CMS + Woo | live, REST OK, **50** produktov v Woo (pilot) |
| Import skript | `storefront/scripts/import-shopify-to-woo.mjs` |
| Env Woo keys | `wordpress-production.local.env` + `storefront/.env.local` |
| Kód dual-CMS | `src/lib/cms.ts`, `catalog/*`, `wordpress/*`, `shopify/*` už prepína podľa `CMS_PROVIDER` |
| Košík Woo | `src/lib/wordpress/cart.ts` (cez `isWordPressCms()`) |
| Platby / doprava Woo | ⚠️ ešte nie produkčne doladené |
| HTML `/produkt/slug` na cms | 404 (rewrite) — **headless to neblokuje** (API funguje) |
| Nexus / dashboard | hybrid; katalóg agenta neskôr z Woo |

---

## 3. Definition of Done (celý cutover)

- [ ] Woo má **≥ 95 %** Shopify produktov (ceny, slug=handle, obrázky)
- [ ] Sklad v Woo zodpovedá realite (nie masívne falošné outofstock, ak tovar je na sklade)
- [ ] Vercel **Preview** beží na `CMS_PROVIDER=wordpress` — listing, PDP, search, košík
- [ ] Testovacia **objednávka** (alebo aspoň cart → checkout URL) cez Woo
- [ ] Vercel **Production** prepnutá na wordpress; www ťahá Woo
- [ ] Shopify checkout sa na www **nepoužíva**
- [ ] 14 dní stabilita → zrušenie Shopify predplatného
- [ ] Žiadne `DB_*` na Vercel; secrets len Woo REST + revalidate

---

## 4. Fázy (presné poradie)

### FÁZA 0 — Príprava (už čiastočne hotové)

| # | Úloha | Ako | Owner |
|---|--------|-----|--------|
| 0.1 | Env Woo + App Password | `wordpress-production.local.env`, `.env.local` | ✅ |
| 0.2 | Woo REST smoke | `yarn woo:smoke` → cms | ✅ |
| 0.3 | Mu-plugins | cors + revalidate na hostingu | ✅ |
| 0.4 | Secret zosúladený | `WORDPRESS_REVALIDATION_SECRET` = `growmedica_revalidation_secret` | ✅ |
| 0.5 | Shell / backup cms | pred full importom: export DB z WebSupport | ⬜ ty |

---

### FÁZA 1 — Katalóg 1:1 v Woo (master dát)

**Cieľ:** Woo = kompletný katalóg; editácia produktov postupne len vo WP.

| # | Úloha | Príkaz / akcia | DoD |
|---|--------|----------------|-----|
| 1.1 | Full import | `cd storefront && node scripts/import-shopify-to-woo.mjs --update` | report errors ~0 |
| 1.2 | Fix SKU kolízie | skript: pri `product_invalid_sku` použiť `shopify-{id}` | re-run failed |
| 1.3 | Porovnanie count | Shopify Admin count vs `X-WP-Total` Woo | ±5 % alebo zdôvodnené |
| 1.4 | Top 20 manuálne | ceny, obrázky, slug na cms admin | checklist |
| 1.5 | Sklad | doplniť qty v Shopify **alebo** Woo; re-import `--update` | in stock kde treba |
| 1.6 | Kategórie | skontrolovať productType → Woo categories | menu dáva zmysel |

**Stop-kritérium:** bez Fázy 1 **neprepnúť** Production.

```bash
cd growmedica-wordpress-dashboard/storefront
node scripts/import-shopify-to-woo.mjs --update
# overenie
curl -sI -u "$WOO_CONSUMER_KEY:$WOO_CONSUMER_SECRET" \
  "https://cms.growmedica.cz/wp-json/wc/v3/products?per_page=1&status=publish" | grep -i x-wp-total
```

---

### FÁZA 2 — Staging: Next.js → WordPress (Preview)

**Cieľ:** overiť, že storefront kód funguje s Woo **bez** zásahu Production.

| # | Úloha | Detail |
|---|--------|--------|
| 2.1 | Vercel **Preview** env | `CMS_PROVIDER=wordpress` |
| | | `WORDPRESS_BASE_URL=https://cms.growmedica.cz` |
| | | `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` (z production.local.env) |
| | | `WORDPRESS_REVALIDATION_SECRET=growmedica-wp-revalidate-2026-prod-k9m2` |
| | | `WOO_MOCK_MODE=0` |
| | | `NEXT_PUBLIC_SITE_URL` = preview URL alebo www |
| 2.2 | Ponechať Shopify env | môžu ostať (nepoužijú sa pri wordpress provider) |
| 2.3 | Deploy preview | push branch / `vercel` preview |
| 2.4 | Test matrix (nižšie §5) | všetko PASS na preview |
| 2.5 | ISR test | zmena produktu v WP → `/api/revalidate` → page refresh |

**Skript (po doladení defaults):**  
`WOO_MOCK_MODE=0 CMS_PROVIDER=wordpress ./scripts/set-wordpress-vercel-env.sh`  
⚠️ default skriptu má `WOO_MOCK_MODE=1` — **pri cutoveri musí byť 0** a reálne `ck_`/`cs_`.

**Lokálny dev:**

```bash
# v storefront/.env.local dočasne:
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=https://cms.growmedica.cz
WOO_CONSUMER_KEY=ck_...
WOO_CONSUMER_SECRET=cs_...
WOO_MOCK_MODE=0
yarn dev
# open http://localhost:5555/produkty
```

---

### FÁZA 3 — Checkout / platby / doprava (Woo)

Bez tohto **nie je** plný e-shop bez Shopify.

| # | Úloha | Poznámka |
|---|--------|----------|
| 3.1 | Woo → Settings → General | SK, EUR, adresy |
| 3.2 | Platby | Stripe / GoPay / bankový prevod (vyber 1–2) |
| 3.3 | Doprava | flat rate SK/CZ alebo Packeta plugin |
| 3.4 | E-maily | SMTP WebSupport (objednávka, spracovanie) |
| 3.5 | Headless cart | `wordpress/cart.ts` + Store API; otestovať add/update/remove |
| 3.6 | Checkout URL | Woo checkout page alebo headless flow; `getWooCheckoutUrl` |
| 3.7 | Test objednávka | 1 skutočná / 0 € test produkt |

**Kód už má:** `isWordPressCms()` vetvy v `catalog/cart.ts`.  
**Doplniť podľa potreby:** platobná brána, shipping zones, prípadne Cart-Token CORS (mu-plugin cors už povoľuje storefront origins).

---

### FÁZA 4 — Production cutover (deň D)

**Okno:** nízka návštevnosť (napr. ráno).  
**Rollback:** 5 minút späť na Shopify (env only).

| Min | Akcia |
|-----|--------|
| T−24h | Full backup cms DB + oznámenie |
| T−2h | Posledný `--update` import zo Shopify |
| T−30m | Preview ešte raz smoke |
| **T0** | Vercel Production env: |
| | `CMS_PROVIDER=wordpress` |
| | `WORDPRESS_BASE_URL=https://cms.growmedica.cz` |
| | `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` |
| | `WORDPRESS_REVALIDATION_SECRET=…` |
| | `WOO_MOCK_MODE=0` |
| | odstrániť / ignorovať `SHOPIFY_STOREFRONT_TOKENLESS` ako source of truth |
| T0+5m | `vercel --prod` (alebo redeploy) |
| T0+10m | Smoke §5 na **www** |
| T0+30m | 1 test objednávka |
| T0+2h | Sledovať errory Vercel + Woo logs |

**Rollback (ak fail):**

```text
Vercel Production: CMS_PROVIDER=shopify
(+ tokenless / storefront token ako predtým)
Redeploy → www späť na Shopify
```

---

### FÁZA 5 — Stabilizácia + sunset Shopify

| Týždeň | Akcia |
|--------|--------|
| 0–2 | Len Woo edits; Shopify read-only / paused storefront password optional |
| 2 | Export Shopify orders/customers CSV (archív) |
| 2–4 | Ak 0 kritických incidentov → **zrušiť Shopify plan** |
| 4+ | Cleanup kódu: odstrániť Shopify paths (voliteľný PR, nie blokujúci) |

---

## 5. Test matrix (povinné pred Production)

| # | Test | Preview WP | Production po cutoveri |
|---|------|------------|-------------------------|
| T1 | `GET /api/products` vráti Woo produkty | ⬜ | ⬜ |
| T2 | `/produkty` listing | ⬜ | ⬜ |
| T3 | PDP `/produkty/{handle}` | ⬜ | ⬜ |
| T4 | Kategória / kolekcia | ⬜ | ⬜ |
| T5 | Search | ⬜ | ⬜ |
| T6 | Add to cart | ⬜ | ⬜ |
| T7 | Cart update / remove | ⬜ | ⬜ |
| T8 | Checkout začiatok | ⬜ | ⬜ |
| T9 | AI „Nájsť doplnky“ | ⬜ | ⬜ |
| T10 | i18n SK/EN/DE routing | ⬜ | ⬜ |
| T11 | Uloženie produktu v WP → revalidate | ⬜ | ⬜ |
| T12 | Mobile + desktop smoke | ⬜ | ⬜ |

```bash
# po preview deployi
PREVIEW_URL=https://….vercel.app yarn production:smoke
curl -s "$PREVIEW_URL/api/products" | head -c 400
```

---

## 6. Env mapa (konkrétne názvy)

### Production Vercel (po cutoveri)

| Premenná | Hodnota |
|----------|---------|
| `CMS_PROVIDER` | `wordpress` |
| `WORDPRESS_BASE_URL` | `https://cms.growmedica.cz` |
| `WOO_CONSUMER_KEY` | `ck_…` (server-only) |
| `WOO_CONSUMER_SECRET` | `cs_…` (server-only) |
| `WORDPRESS_REVALIDATION_SECRET` | rovnaký ako WP option |
| `WOO_MOCK_MODE` | `0` alebo **zmazať** |
| `NEXT_PUBLIC_SITE_URL` | `https://www.growmedica.cz` |
| `NEXT_PUBLIC_DASHBOARD_MODE` | `hybrid` |
| `NEXT_PUBLIC_DASHBOARD_URL` | Nexus alebo cms wp-admin |
| `MISTRAL_*` | bez zmeny |
| **NIKDY** | `DB_NAME`, `DB_PASSWORD`, … |

### WordPress (cms) — už / doplniť

| | |
|--|--|
| Admin | `info@growmedica.cz` |
| Woo REST | Read/Write keys |
| Options | `growmedica_storefront_url`, `growmedica_revalidation_secret` |
| Mu-plugins | `growmedica-cors.php`, `growmedica-revalidate.php` |

---

## 7. Súbory v repo (orientácia)

| Cesta | Úloha pri cutoveri |
|-------|-------------------|
| `src/lib/cms.ts` | prepínač provider |
| `src/lib/catalog/*` | unified API |
| `src/lib/wordpress/*` | Woo client, products, cart |
| `src/lib/shopify/*` | legacy do Fázy 5 |
| `scripts/import-shopify-to-woo.mjs` | Fáza 1 |
| `scripts/set-wordpress-vercel-env.sh` | Fáza 2/4 (s `WOO_MOCK_MODE=0`) |
| `wordpress/mu-plugins/*` | revalidate + cors |
| `docs/WP_WEBHOOKS.md` | ISR (nie Woo UI webhooks) |

---

## 8. Riziká a mitigácie

| Riziko | Mitigácia |
|--------|-----------|
| Prázdny katalóg po prepnutí | Fáza 1 complete + Preview T1 |
| SKU duplicity pri importe | `shopify-{id}` fallback |
| Sklad 0 | inventory v Woo pred cutoverom |
| Pomalý shared hosting | cache Next ISR + CDN; sledovať cms TTFB |
| Platby nefungujú | Fáza 3 pred Production |
| Dual edit Shopify+Woo | po Fáze 2: **edit len Woo** |
| HTML 404 na cms `/produkt/` | headless OK; fix rewrite voliteľný |

---

## 9. Čo NEROBIŤ

- ❌ `CMS_PROVIDER=wordpress` na Production pred full importom  
- ❌ `DB_*` na Vercel  
- ❌ Woo UI Webhooky namiesto mu-pluginu (duplicita)  
- ❌ Zrušiť Shopify v deň cutoveru (držať 2–4 týždne ako backup)  
- ❌ UI redesign počas cutoveru (UI freeze)

---

## 10. Okamžitý ďalší krok (jedna vetva)

```text
TERAZ:  Fáza 1.1 — full import
        node scripts/import-shopify-to-woo.mjs --update

POTOM:  Fáza 2 — Preview env wordpress + test matrix
POTOM:  Fáza 3 — platby/doprava
POTOM:  Fáza 4 — Production cutover
NAPOKON: Fáza 5 — zrušiť Shopify
```

---

## 11. Schválenie

| | |
|--|--|
| Blueprint súbor | `reports/WORDPRESS_CUTOVER_BLUEPRINT.md` |
| Import blueprint | `reports/SHOPIFY_TO_WOO_IMPORT_BLUEPRINT.md` |
| Ďalší príkaz po tvojom „áno“ | full import **alebo** Preview env |

**Jedna veta:**  
Cutover = (1) kompletný Woo katalóg → (2) Preview Next na wordpress → (3) platby → (4) Production env flip → (5) Shopify off. Kód už vie prepínať; chýbajú dáta, checkout a prepnutie env.
