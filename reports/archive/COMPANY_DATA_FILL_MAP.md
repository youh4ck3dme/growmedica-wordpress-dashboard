# Mapa: kam doplniť firemné a bankové údaje GrowMedica

**Údaje (source of truth pre tento plán):**

| Pole | Hodnota |
|------|---------|
| Obchodné meno | GrowMedica s.r.o. |
| Adresa | Bellova 3455 / 6 |
| PSČ / mesto | 040 01 Košice - Staré Mesto |
| Krajina | Slovenská republika |
| IČO | 56 455 143 |
| DIČ | 2122314975 |
| IBAN | SK48 0200 0000 0050 3517 2956 |
| BIC / SWIFT | SUBASKBX |
| E-mail | info@growmedica.cz |

**Poznámka k adrese:** skôr bolo v Woo `BELLOVA 6` — plný tvar je **Bellova 3455 / 6, 040 01 Košice - Staré Mesto**.

**SMTP heslo:** nastavuješ ty; tu sa nemení.

---

## A) WooCommerce CMS (`cms.growmedica.cz`) — priorita 1

| # | Kde v admin | Čo doplniť / upraviť | Stav teraz |
|---|-------------|----------------------|------------|
| A1 | **Nastavenia → Všeobecné** | Adresa: Bellova 3455/6, Košice - Staré Mesto, 040 01, SK; firma v address_2 | ✅ 2026-07-16 |
| A2 | **Nastavenia → Platby → Bankový prevod** | IBAN, BIC, názov banky (VÚB), meno majiteľa účtu | ✅ inštrukcie s IBAN/BIC |
| A3 | **Nastavenia → E-maily** | From name/adresa (už OK); pätička s IČO/DIČ/adresou | ✅ footer + SK subjects |
| A4 | **Nastavenia → Pokročilé** | Stránka **Obchodné podmienky** (VOP) priradiť | 🔴 prázdne |
| A5 | **Stránky WP** (alebo shortcode) | VOP, GDPR, reklamácie — text s IČO/DIČ/sídlom | 🟡 |
| A6 | **Faktúry / PDF** (ak plugin neskôr) | Dodávateľ = tabuľka vyššie | ⬜ nie je plugin |
| A7 | **Code Snippet SMTP** | From už nastavené; heslo ty | 🟡 heslo |
| A8 | **FluentSMTP** | rovnaké From; heslo ty | 🟡 heslo |

**Woo nemá natívne polia IČO/DIČ** v „Všeobecné“ — treba:
- text do **BACS inštrukcií**, e-mail pätičky, VOP, a/alebo
- plugin SK (WPify / fakturácia) neskôr.

---

## B) Next.js storefront (`www.growmedica.cz`) — priorita 1

### B1. Centrálny súbor (najprv vytvoriť / rozšíriť)

| Súbor | Úprava |
|-------|--------|
| `storefront/src/lib/brand.ts` | Pridať `COMPANY = { legalName, street, city, zip, country, ico, dic, iban, bic, email, bankName }` — **jediný SoT v kóde** |
| Voliteľne `storefront/src/lib/company.ts` | re-export / formátované bloky pre VOP a footer |

### B2. Stránky s právnymi / kontaktnými textami

| URL / súbor | Čo upraviť |
|-------------|------------|
| `/kontakt` → `app/kontakt/page.tsx` | ✅ reálne IČO/DIČ + Bellova 3455/6 (via `company.ts`) |
| `/ochrana-osobnych-udajov` → `app/ochrana-osobnych-udajov/page.tsx` | ✅ prevádzkovateľ sídlo + IČO/DIČ |
| `/obchodne-podmienky` → `app/obchodne-podmienky/page.tsx` | ✅ predávajúci + IBAN |
| `/reklamacny-poriadok` → `app/reklamacny-poriadok/page.tsx` | ✅ predávajúci / adresa vrátenia |
| `/doprava-a-platba` → `app/doprava-a-platba/page.tsx` | ✅ IBAN + BIC + dodávateľ |
| `/o-nas` → `app/o-nas/page.tsx` | `companyName` / sídlo ak sa zobrazuje |
| `/velkoobchod` | Fakturačné údaje ak spomenuté |
| `/faq` | len ak spomína firmu/účet |

### B3. UI komponenty

| Súbor | Úprava |
|-------|--------|
| `components/layout/Footer.tsx` | Voliteľne riadok: firma, IČO, adresa (nie banka v footeri — skôr odkaz na VOP) |
| `lib/brand.ts` → `pageDescriptions.contact` | Už má staré „BELLOVA 6, KOŠICE“ → aktualizovať |
| `lib/i18n/locales/sk.json` (+ en/de) | Ak sú hardcoded adresy v prekladoch |

### B4. SEO / meta

| Súbor | Úprava |
|-------|--------|
| `lib/seo.ts` / `brand.ts` | Organization JSON-LD: name, address, ico (ak pridáte schema) |

### B5. **Nemeniť** (nie firemné IČO)

| Miesto | Dôvod |
|--------|--------|
| Product copy / AI prompty | nie sídlo |
| Shopify (ak ešte beží) | neskôr sunset; nie priorita ak Woo = SoT |
| Design tokeny / UI freeze layout | len textové údaje |

---

## C) WordPress CMS téma (cms storefront)

| # | Kde | Čo |
|---|-----|-----|
| C1 | Woo e-mail footer (už A3) | IČO, DIČ, IBAN voliteľne |
| C2 | Stránka Pokladňa / order emails | dodávateľ na faktúre (plugin) |
| C3 | Code Snippets SMTP From | už GrowMedica s.r.o. |
| C4 | Footer CMS | už skrytý — OK |

---

## D) Externé systémy (nie kód, ale checklist)

| Systém | Čo nastaviť |
|--------|-------------|
| **WebSupport** e-mail | heslo SMTP (ty) |
| **Stripe / GoPay** | legal entity = GrowMedica s.r.o., IČO, adresa |
| **Packeta / DPD** | odosielateľ = sídlo + kontakt |
| **Fakturačný SW** (neskôr) | rovnaké IČO/DIČ/IBAN |
| **Google / Firebase** (Nexus) | len ak firemný billing |

---

## Odporúčané poradie implementácie

```
1. brand.ts / company.ts     ← jeden source of truth v Next
2. kontakt + doprava-a-platba + VOP + GDPR + reklamácie
3. Woo: adresa (update 3455/6) + BACS IBAN/BIC + e-mail footer IČO/DIČ
4. Woo: priradiť stránku VOP v Pokročilé
5. Footer Next (krátky legal riadok)
6. (Neskôr) fakturačný plugin na cms
```

---

## Matrica „Dodávateľ“ vs „Odberateľ“

| Kontext | Dodávateľ (vy) | Odberateľ (zákazník) |
|---------|----------------|----------------------|
| Faktúra / objednávka Woo | GrowMedica s.r.o. + IČO/DIČ/adresa/IBAN | z checkout formulára |
| VOP / GDPR na www | predávajúci / prevádzkovateľ = firma | subjekt údajov |
| Kontakt stránka | sídlo + IČO/DIČ + e-mail | formulár |
| Bankový prevod | IBAN + BIC na vašom účte | platí zákazník |
| Footer | voliteľne len názov + IČO | — |

---

## Čo ešte **nedoplníme** bez teba

| Vec | Prečo |
|-----|--------|
| SMTP heslo | nastavuješ ty |
| Plné legálne VOP | právny text, nie len IČO |
| Stripe/GoPay KYC | ich dashboard |
| Packeta/DPD API | ich účty |

---

## Potvrdenie pred zápisom

Keď napíšeš **„doplň údaje“**, pôjdem podľa poradia 1→5 vyššie  
(central `brand`/`company` + legal pages + Woo adresa/IBAN/e-mail).

**Bez zmeny UI layoutu** (len texty a Woo settings) — UI freeze dodržaný.
