# WooCommerce e-mailové šablóny — GrowMedica

**Aktualizované:** 2026-07-16  
**From:** GrowMedica s.r.o. &lt;info@growmedica.cz&gt;  
**Footer (všetky e-maily):**

```
GrowMedica s.r.o.
Bellova 3455 / 6, 040 01 Košice - Staré Mesto, Slovenská republika
IČO: 56 455 143 · DIČ: 2122314975
IBAN: SK48 0200 0000 0050 3517 2956 · BIC: SUBASKBX
info@growmedica.cz
```

**Farba brandu e-mailov:** `#166534`

Údaje dodávateľa: `docs/vzorfirma.md` · kód: `storefront/src/lib/company.ts`

---

## Zákaznícke e-maily

| Šablóna | Subject | Obsah (additional) |
|---------|---------|---------------------|
| **Čaká na platbu** (`on_hold`) | Vaša objednávka #{order_number} čaká na platbu | IBAN + BIC + IČO + kontakt |
| **Spracováva sa** (`processing`) | Potvrdenie objednávky #{order_number} | potvrdenie + kontakt |
| **Vybavená** (`completed`) | Objednávka #{order_number} bola odoslaná | ďakovanie + adresa reklamácií |
| **Faktúra / detaily** (`invoice`) | Faktúra / detaily objednávky #{order_number} | dodávateľ + IBAN + DIČ |
| **Refund** | (default) | kontakt + info o vrátení |
| **Poznámka** | (default) | kontakt |
| **Nový účet** | Váš účet na {site_title} | vitajte + kontakt |
| **Obnova hesla** | Obnova hesla — {site_title} | kontakt |

## Admin e-maily

| Šablóna | Príjemca | Subject |
|---------|----------|---------|
| Nová objednávka | info@growmedica.cz | [{site_title}]: Nová objednávka #{order_number} |
| Zrušená / neúspešná | info@growmedica.cz | (Woo default SK) |

---

## Bankový prevod (BACS)

V inštrukciách pre zákazníka:

- Príjemca: GrowMedica s.r.o.
- IBAN: SK48 0200 0000 0050 3517 2956
- BIC: SUBASKBX
- Banka: VÚB, a.s.
- IČO / DIČ + adresa

---

## SMTP

| Položka | Hodnota |
|---------|---------|
| Host | smtp.m1.websupport.sk:465 SSL |
| User / From | info@growmedica.cz |
| Snippet | GrowMedica SMTP Websupport (active) |

---

## Kde upraviť v admin

CMS → WooCommerce → Nastavenia → **E-maily**  
jednotlivé typy → Predmet / Nadpis / Dodatočný obsah / Pätička (globálna).
