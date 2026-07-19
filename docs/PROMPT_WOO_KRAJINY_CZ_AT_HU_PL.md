# Prompt — krajiny CZ / AT / HU / PL do WooCommerce CMS

**Účel:** skopíruj blok nižšie agentovi (Cursor / WP admin), ktorý má rozšíriť predaj a dopravu o Česko, Rakúsko, Maďarsko a Poľsko.  
**CMS:** https://cms.growmedica.cz/wp-admin  
**E-shop:** https://www.growmedica.cz  
**Dátum dát:** 2026-07-19  
**Stav firmy:** neplatca DPH → výpočet daní v Woo **nezapínať**.

Súvisiace: [vzorfirma.md](./vzorfirma.md) · [majitel.md](../majitel.md) §9 · [MERCHANT_KEYS.md](./MERCHANT_KEYS.md)

---

## Prompt (skopíruj celé)

```
Si agent pre GrowMedica WooCommerce CMS na https://cms.growmedica.cz

Cieľ: pridať predaj a dopravu do krajín Česko (CZ), Rakúsko (AT), Maďarsko (HU), Poľsko (PL)
okrem existujúceho Slovenska (SK). Nastav mená krajín, % DPH (pripravené sadzby),
všetko podstatné o predaji produktov, a flat-rate poštovné podľa odhadu Slovenskej pošty.

## Kontext (NEMENIŤ bez výslovného súhlasu)
- Predávajúci: GrowMedica s.r.o., krajina obchodu SK, mena EUR
- Firma = neplatca DPH (IČ DPH prázdne). Woo option woocommerce_calc_taxes MUSÍ ostať „no“.
- Existujúca shipping zóna Slovensko (DPD 3,90 € / Packeta 2,90 € / free ≥ 50 €) — NEMAZAŤ, NEMENIŤ ceny.
- Firemné údaje, IČO, DIČ, IBAN, BACS inštrukcie — NEMENIŤ.
- Stripe / GoPay / Packeta API / DPD API — NEZAPÍNAŤ ani nekonfigurovať merchant kľúče.
- Mena: EUR (žiadne CZK / HUF / PLN).
- Storefront i18n (cs/de/sk/en) a Next.js kód — NEMENIŤ v tejto úlohe (len Woo CMS).

## 1) WooCommerce → Nastavenia → Všeobecné
Nastav (alebo over):

| Option | Hodnota |
|--------|---------|
| Predajné lokality (allowed) | specific |
| Specifické krajiny predaja | SK, CZ, AT, HU, PL |
| Dopravné lokality (ship to) | specific |
| Specifické krajiny dopravy | SK, CZ, AT, HU, PL |
| Predvolená krajina obchodu | SK (Slovensko) |
| Mena | EUR |
| Predvolená adresa zákazníka | geolocate alebo shop base — SK |

Názvy krajín v UI (SK/EN podľa admin jazyka):
- SK — Slovensko / Slovakia
- CZ — Česko / Czechia (Czech Republic)
- AT — Rakúsko / Austria
- HU — Maďarsko / Hungary
- PL — Poľsko / Poland

## 2) DPH — vytvor sadzby, ale NEVYPOČÍTAJ dane
WooCommerce → Nastavenia → Dane:

A) Options:
- Enable taxes / woocommerce_calc_taxes = **no** (POVINNÉ — neplatca)
- Prices entered with tax = no (ponechaj súčasné)
- Display prices in shop/cart = excl (ponechaj súčasné)
- Calculate tax based on = **Shipping address** (pripravené na budúcnosť)
- Shipping tax class = based on cart items (default OK)

B) Štandardné sadzby (Standard rates) — pridaj / aktualizuj riadky podľa krajiny
   (Country code, State prázdny, Postcode *, City *, Rate %, Name, Priority 1, Compound no, Shipping yes):

| Country | Rate % | Tax name |
|---------|--------|----------|
| SK | 23 | DPH SK |
| CZ | 21 | DPH CZ |
| AT | 20 | DPH AT (USt) |
| HU | 27 | DPH HU (ÁFA) |
| PL | 23 | DPH PL (VAT) |

Poznámka v reporte: sadzby sú pripravené; zákazníkom sa NEÚČTUJÚ, kým majiteľ + účtovník
nepovolí platcu DPH / OSS a agent nezmení calc_taxes na yes.

## 3) Doprava — nové zóny (Slovenská pošta)
WooCommerce → Nastavenia → Doprava → Shipping zones.

Pre KAŽDÚ krajinu CZ, AT, HU, PL vytvor samostatnú zónu:
- Zone name: „Česko“ / „Rakúsko“ / „Maďarsko“ / „Poľsko“
- Region: príslušný country code (CZ / AT / HU / PL)
- Metóda: Flat rate
  - Title (zákazník): „Slovenská pošta – balík“
  - Tax status: Taxable (aj keď dane sú vypnuté — pre budúcnosť)
  - Cost: podľa tabuľky nižšie
- Free shipping v týchto zónach: **NEPRIDÁVAŤ**
- Packeta / DPD metódy do týchto zón: **NEPRIDÁVAŤ** (iba SK zóna ich má)

### Poštovné — výpočet (1 typický e-shop balík)
Predpoklady:
- Hmotnosť ≈ **1,5 kg**
- Štandardné rozmery e-shop balíka (nie nadrozmer)
- Služba: balík do zahraničia — ekonomická / pozemná pre susedné krajiny EÚ
- Podanie: **online** (ePodací hárok / app) podľa cenníka Slovenskej pošty
- Zdroj overenia: https://www.posta.sk/cennik (kalkulátor / tarifa medzinárodný styk, platná 2026)
- K overenému nákladu SP pridaj **+1,50 €** manipulačný príplatok
- Zaokrúhli nahor na 0,10 € → to je Woo flat rate Cost

Ak kalkulátor posta.sk nie je dostupný, použi DRAFT odhady nižšie a v reporte
výslovne napíš „odhad — overiť na posta.sk“:

| Krajina | Odhad nákladu SP (≈1,5 kg) | Woo Cost (+1,50 €) |
|---------|----------------------------|---------------------|
| CZ | 11,50 € | **13,00** |
| AT | 12,50 € | **14,00** |
| HU | 12,50 € | **14,00** |
| PL | 13,50 € | **15,00** |

Ak overíš reálne ceny na posta.sk, PREPÍŠ Woo Cost podľa vzorca (náklad + 1,50, round up 0,10)
a v reporte uveď pôvodný cenník aj finálnu cenu.

SK zóna: ponechaj DPD 3,90 / Packeta 2,90 / free ≥ 50 — bez zmeny.

## 4) Platby (podstatné pre medzinárodný predaj)
WooCommerce → Nastavenia → Platby:

- BACS (bankový prevod): nechaj zapnutý — funguje pre všetky povolené krajiny.
- COD (dobierka): nechaj zapnutý len ak je viazaný na SK / alebo vypni dostupnosť
  pre CZ/AT/HU/PL (dobierka do zahraničia cez SP nie je spoľahlivá; HU často bez COD).
  Preferencia: COD len pre shipping country SK.
- Stripe / GoPay: nechaj ako sú (nekonfiguruj nové kľúče).

## 5) Produktový predaj — checklist (žiadne per-country ceny)
- Katalóg ostáva jeden (EUR). Nepridávaj country-specific product prices.
- Over, že produkty sú purchasable (publish, in stock / backorders podľa súčasného stavu).
- Žiadne ACF / CPT „market“ — netreba; všetko je Woo options + zones.
- SuperFaktúra: nemenit API; faktúry ostávajú v EUR / SK firma.

## 6) Overenie (acceptance)
Pre každú krajinu CZ, AT, HU, PL:
1. Checkout (alebo Store API) s shipping country = daná krajina
2. Zobrazí sa metóda „Slovenská pošta – balík“ s očakávanou cenou
3. Nezobrazia sa SK-only Packeta/DPD flat rates z SK zóny
4. taxesEnabled / calc_taxes ostáva false / no
5. Objednávku netreba nutne dokončiť na produkcii — stačí overenie shipping rates
   (ak robíš test order, použi BACS + jasnú test adresu a zruš/refund podľa procesu)

SK regresia: shipping country SK stále ukazuje DPD / Packeta / free ≥ 50.

## 7) Zakázané
- Mazanie alebo zmena SK shipping zóny a jej cien
- Zapnutie woocommerce_calc_taxes
- Zmena meny, firemných údajov, VOP textov
- Úpravy storefront Next.js / i18n v tejto úlohe
- Pridávanie free shipping mimo SK
- Commit secrets (.env, API keys)

## 8) Výstupný report (povinný)
Po dokončení napíš krátky report:
1. Allowed + ship-to krajiny (zoznam)
2. Tax rates vytvorené (tabuľka) + potvrdenie calc_taxes = no
3. Shipping zones vytvorené (názov, country, flat rate cost)
4. Či boli ceny overené na posta.sk alebo sú draft odhady
5. Stav COD pre zahraničie
6. Odkazy do adminu:
   - https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=general
   - https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=tax
   - https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=shipping
7. Čo ostáva majiteľovi: rozhodnutie platca DPH s účtovníkom; prípadne Packeta/DPD zmluvy pre CZ atď.

Preferuj WP-CLI / Woo REST, ak máš SSH/API prístup; inak admin UI.
Nemeň nič mimo rozsahu tejto úlohy.
```

---

## Rýchly súhrn dát (pre človeka)

### Krajiny

| Názov SK | ISO | Štandardná DPH (2026) |
|----------|-----|------------------------|
| Slovensko | SK | 23 % |
| Česko | CZ | 21 % |
| Rakúsko | AT | 20 % |
| Maďarsko | HU | 27 % |
| Poľsko | PL | 23 % |

### Draft poštovné (Slovenská pošta ≈1,5 kg + 1,50 €)

| Krajina | Woo flat rate |
|---------|---------------|
| CZ | 13,00 € |
| AT | 14,00 € |
| HU | 14,00 € |
| PL | 15,00 € |

### Admin skratky

| Úloha | URL |
|-------|-----|
| Všeobecné (krajiny) | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=general |
| Dane | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=tax |
| Doprava | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=shipping |
| Cenník SP | https://www.posta.sk/cennik |

### Smoke test (namiesto manuálneho checklistu)

```bash
cd growmedica-wordpress-dashboard
./scripts/smoke-woo-countries-cz-at-hu-pl.sh
```

Report: [../reports/WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md](../reports/WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md)
