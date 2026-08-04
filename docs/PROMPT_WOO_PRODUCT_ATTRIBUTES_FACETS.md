# Prompt — nové WooCommerce product attributes pre facety (certifikáty / veková skupina / hmotnosť / špecifické potreby)

**Účel:** skopíruj blok nižšie agentovi (Cursor / WP admin) na CMS strane, aby sa doplnili chýbajúce WooCommerce product attributes potrebné pre zvyšok Fázy 3 storefront filtrov (sidebar facety na `/produkty`, `/kategorie/*`, `/kolekcie/*`).
**CMS:** https://cms.growmedica.cz/wp-admin
**E-shop:** https://www.growmedica.cz
**Dátum:** 2026-08-04
**Kontext:** storefront strana (rating facet + ProductCard Bestseller/Novinka badge) je už implementovaná a nasadená (`Growmedica-front+DASHBOARD/growmedica-wordpress-dashboard/storefront`). Tento dokument rieši len chýbajúci krok — nové Woo product attributes — bez ktorých nemôže storefront zobraziť zvyšné facety.

Súvisiace: [MERCHANT_KEYS.md](./MERCHANT_KEYS.md) · [../STATUS.md](../STATUS.md) · [../TODO.md](../TODO.md)

---

## Prompt (skopíruj celé)

```
Si agent pre GrowMedica WooCommerce CMS na https://cms.growmedica.cz

Cieľ: pridať 4 nové globálne product attributes (taxonomy-based, pa_ prefix) a priradiť
hodnoty existujúcim produktom, aby storefront mohol zobraziť nové filtrovacie facety
(certifikáty, veková skupina, hmotnosť, špecifické potreby).

## Kontext (NEMENIŤ bez výslovného súhlasu)
- Toto je len WooCommerce CMS úloha (Produkty → Atribúty). Storefront kód, i18n,
  Next.js komponenty a design — NEMENIŤ v tejto úlohe.
- Nemeň existujúce atribúty, kategórie, ceny, sklad ani predajné/dopravné zóny.
- Nový atribút musí byť "Used for variations" = NIE (sú to filtrovacie tagy, nie
  varianty produktu ako veľkosť/farba).
- Zachovaj SK jazyk pre názvy termov (rovnaký jazyk ako existujúce kategórie/tagy).

## 1) WooCommerce → Produkty → Atribúty → Pridať nový atribút

Vytvor 4 globálne atribúty (Name / Slug automaticky pa_<slug>):

| Name (SK)              | Slug (bez pa_ prefixu) | Enable archives |
|-------------------------|------------------------|------------------|
| Certifikácia             | certifikacia            | áno |
| Veková skupina           | vekova-skupina           | áno |
| Hmotnosť                 | hmotnost                 | áno |
| Špecifické potreby       | specificke-potreby       | áno |

## 2) Pre každý atribút vytvor termy (hodnoty)

**Certifikácia** (pa_certifikacia) — over s ownerom presné certifikáty relevantné pre
sortiment, návrh:
- Bio / Organic
- Vegan
- Bez lepku
- Bez laktózy
- GMO-free
- Informed Sport

**Veková skupina** (pa_vekova-skupina):
- Deti
- Dospelí
- Seniori
- Tehotné a dojčiace

**Hmotnosť** (pa_hmotnost) — návrh rozsahov (uprav podľa reálnych SKU, nie presné gramáže
každého produktu, ale bucket kategórie):
- Do 100 g
- 100–300 g
- 300–500 g
- Nad 500 g

**Špecifické potreby** (pa_specificke-potreby):
- Šport a výkon
- Kĺby a pohyb
- Imunita
- Trávenie
- Spánok a stres
- Srdce a cievy
- Krása a pokožka
- Detox a pečeň

## 3) Priradenie termov produktom

- Pre každý existujúci produkt (14 kategórií, aktuálny katalóg) priraď relevantné termy
  cez Produkty → Upraviť produkt → záložka Atribúty → vyber hodnoty z každého pa_ atribútu
  (multi-select, produkt môže mať viac hodnôt na atribút, napr. viac certifikácií).
- Ak je produktov veľa, zváž hromadné priradenie cez CSV import (WooCommerce Product CSV
  Importer, stĺpce `attribute:certifikacia`, `attribute:vekova-skupina`, atď. — hodnoty
  oddelené `|`) namiesto ručného úpravu každého produktu.
- Atribúty nezobrazuj vo "Product page" tabuľke špecifikácií, ak by to duplicitne
  opakovalo info z popisu — over s ownerom, či majú byť viditeľné aj na detaile produktu
  (Attribute → "Visible on the product page" checkbox), alebo len ako facet dáta.

## 4) Overenie

- Woo REST API `/wp-json/wc/v3/products` musí vrátiť `attributes[]` pole s `name`/`options[]`
  pre upravené produkty (over cez `curl` alebo Postman s existujúcimi Woo API kľúčmi).
- Nahlás späť storefront agentovi presné slugy atribútov a termov (môžu sa líšiť od návrhu
  vyššie), aby sa dal domapovať `src/lib/wordpress/adapter.ts` a facet UI
  (`FilterableProductList.tsx`) na reálne dáta.
```

---

## Storefront-side nadväzujúce kroky (po dokončení CMS kroku vyššie)

Až po potvrdení reálnych slugov atribútov a termov v CMS, storefront agent doplní (repo
`Growmedica-front+DASHBOARD/growmedica-wordpress-dashboard/storefront`):

1. `src/lib/wordpress/types.ts` — `attributes: WooProductAttribute[]` pole na `WooProduct`
   (Woo REST `attributes[]`, ak ešte chýba).
2. `src/lib/catalog/types.ts` — nové pole na `ProductListItem`, napr.
   `attributesFacets?: Record<string, string[]>`.
3. `src/lib/wordpress/adapter.ts` — namapovať `attributes[]` → `attributesFacets` podľa
   potvrdených `pa_` slugov.
4. `src/lib/product-facets.ts` — extrakčné funkcie per atribút (analogicky
   `getProductEffectLabels`/`getRatingFacetBuckets`).
5. `src/components/product/FilterableProductList.tsx` — nové facet sekcie (Certifikácia,
   Veková skupina, Hmotnosť, Špecifické potreby), rovnaký UX vzor ako existujúca
   "Hodnotenie" facet sekcia.
6. `src/lib/product-filter-url.ts` — nové URL parametre pre každý atribút (round-trip,
   rovnaký vzor ako `minRating`/`?rating=`).
7. Testy: rozšíriť `tests/unit/product-filter-url.test.mjs` + `yarn test:woo:integrity`.

**Poznámka:** "Platidlo" (spôsob platby) facet z pôvodnej referencie sa odporúča vynechať —
nie je to product-level atribút vhodný na filtrovanie (checkout-level rozhodnutie).
