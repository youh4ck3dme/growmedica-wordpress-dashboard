# Vzor firmy — GrowMedica (Dodávateľ / Odberateľ)

**Source of truth** pre faktúry, e-maily, VOP, GDPR, WooCommerce a storefront.  
Kód: `storefront/src/lib/company.ts` (musí sedieť s touto tabuľkou).

---

## Dodávateľ (predávajúci / prevádzkovateľ e-shopu)

| Pole | Hodnota |
|------|---------|
| Obchodné meno | **GrowMedica s.r.o.** |
| Ulica / číslo | **Bellova 3455 / 6** |
| PSČ / mesto | **040 01 Košice - Staré Mesto** |
| Krajina | **Slovenská republika** |
| IČO | **56 455 143** |
| DIČ | **2122314975** |
| E-mail | **info@growmedica.cz** |
| Telefón | *(doplniť — zatiaľ sa na webe nezobrazuje)* |
| Web (eshop) | https://www.growmedica.cz |
| CMS | https://cms.growmedica.cz |

### Bankové spojenie (bankový prevod)

| Pole | Hodnota |
|------|---------|
| Číslo účtu (IBAN) | **SK48 0200 0000 0050 3517 2956** |
| BIC / SWIFT | **SUBASKBX** |
| Banka | VÚB, a.s. (podľa BIC SUBASKBX) |
| Majiteľ účtu | GrowMedica s.r.o. |

### Formátovaný blok (kopírovať do e-mailov / PDF)

```
Dodávateľ:
GrowMedica s.r.o.
Bellova 3455 / 6
040 01 Košice - Staré Mesto
Slovenská republika

IČO: 56 455 143
DIČ: 2122314975

Číslo účtu: SK48 0200 0000 0050 3517 2956
BIC / SWIFT: SUBASKBX
```

### Jednoriadkový (footer, meta)

```
GrowMedica s.r.o. · Bellova 3455/6, 040 01 Košice - Staré Mesto · IČO: 56 455 143 · DIČ: 2122314975
```

---

## Odberateľ (kupujúci)

Údaje **nevyplňujeme napevno** — prichádzajú z:

- WooCommerce checkout (meno, adresa, e-mail, telefón, voliteľne IČO/DIČ firiem)
- Next.js košík → pokladňa CMS

Na faktúre / v e-maile objednávky:

| Pole | Zdroj |
|------|--------|
| Meno / firma | billing first_name, last_name / company |
| Adresa | billing address_1, address_2, city, postcode, country |
| E-mail / telefón | billing email, phone |
| IČO / DIČ odberateľa | ak B2B / voliteľné polia |

---

## Kde sa používajú (checklist)

| Miesto | Dodávateľ | Odberateľ |
|--------|-----------|-----------|
| Woo Nastavenia → Všeobecné (adresa obchodu) | ✅ | — |
| Woo Platby → Bankový prevod (BACS) | IBAN + BIC | platí |
| Woo e-mail pätička | ✅ IČO/DIČ/adresa | — |
| Faktúra / PDF (neskôr) | dodávateľ blok | z objednávky |
| Next `/kontakt` | sídlo + IČO/DIČ | formulár |
| Next VOP / GDPR / reklamácie | predávajúci | zákazník |
| Next `/doprava-a-platba` | IBAN pri bankovom prevode | — |
| Footer storefront | názov + adresa + IČO | — |

---

## Poznámky

- Adresa v tvare **Bellova 3455 / 6** (nie skrátene „BELLOVA 6“).
- IČO s medzerou ako na OR: `56 455 143` (v systémoch bez medzier: `56455143`).
- DIČ: `2122314975` (nie je to IČ DPH — IČ DPH doplniť až po registrácii).
- SMTP From: `info@growmedica.cz` / meno `GrowMedica s.r.o.`

*Posledná aktualizácia: 2026-07-16*
