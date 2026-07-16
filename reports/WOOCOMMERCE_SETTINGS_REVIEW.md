# Audit WooCommerce nastavení — cms.growmedica.cz

**Dátum:** 2026-07-16  
**Zdroj:** Woo REST `/wp-json/wc/v3/settings/*` + payment_gateways + shipping zones  
**Admin:** https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings  

Legenda: ✅ OK · 🟡 doladiť · 🔴 blokuje predaj

---

## Súhrn

| Sekcia | Verdikt | Komentár |
|--------|---------|----------|
| Všeobecné | ✅ | SK + EUR + adresa Bellova 3455/6 (2026-07-16 večer) |
| Produkty | ✅ | Sklad zapnutý, recenzie OK |
| Doprava | ✅ | SK zóna: DPD 3,90 / odberné 2,90 / Packeta 2,90 / free od 50 € |
| Platby | 🟡 | **BACS + COD** ON; Stripe/GoPay trebajú merchant keys |
| Účty a súkromie | ✅ | Guest checkout OK |
| E-maily | ✅ | From + footer IČO/DIČ/IBAN + SK subjects; SMTP OK |
| Integrácia | ✅/— | prázdna / default |
| Viditeľnosť stránky | ✅ | Coming soon = **no** (live) |
| Predajné miesto (POS) | ✅ | vypnuté |
| Pokročilé | ✅ | Košík/pokladňa/účet + **VOP terms_page_id** |
| Dane | 🟡 | Dane vypnuté — pre SK B2C často treba 20 % DPH |

**Smoke:** test order REST (BACS + DPD 3,90) → total OK → cancelled.

---

## 1. Všeobecné

| Nastavenie | Hodnota | Stav |
|------------|---------|------|
| Krajina | **SK** | ✅ |
| Mena | **EUR** | ✅ |
| Formát ceny | `right_space`, desatinná `,`, 2 miesta | ✅ SK štýl |
| Adresa obchodu | **BELLOVA 6, GrowMedica s.r.o., Košice 040 01** | ✅ (2026-07-16) |
| Predaj do krajín | **specific → SK** | ✅ |
| Doprava do | **specific → SK** | ✅ (zóny metód ešte treba) |
| Dane | **vypnuté** | 🟡 pozri sekciu Dane |
| Kupóny | áno | ✅ |

**Odporúčané hodnoty (B2C SK):**
- Adresa: reálna fakturačná adresa GrowMedica  
- Predaj / doprava: `specific` → SK (prípadne CZ)  
- Po doplnení IČO/DIČ do adries faktúr (nie nutne toto pole)

---

## 2. Produkty

| Nastavenie | Hodnota | Stav |
|------------|---------|------|
| Stránka obchodu | ID 8 (`/obchod`) | ✅ |
| Sledovanie skladu | **yes** | ✅ |
| Low stock / out of stock e-maily | áno → `info@growmedica.sk` | ✅ |
| Low stock prah | 2 | ✅ |
| Skryť vypredané | no | ✅ (zobrazí sa „vypredané“) |
| Jednotky | kg / cm | ✅ |
| Recenzie | zapnuté + rating required | ✅ OK, alebo vypni ak nechceš spam |
| AJAX add to cart | yes | ✅ |
| Redirect po pridaní do košíka | no | ✅ (headless/Next) |

**OK na produkciu katalógu.** Sklad na importovaných produktoch ešte kontroluj v zozname produktov.

---

## 3. Doprava 🔴

| | |
|--|--|
| Zóny | len „Rest of the world“ (id 0) |
| Metódy | **žiadne** |

**Treba nastaviť napr.:**
1. Zóna **Slovensko** → krajina SK  
2. Metóda **Paušálna sadzba** (flat rate) napr. 3,90 € / 4,90 €  
3. Voliteľne: osobný odber (local pickup) 0 €  
4. (Neskôr) Packeta / SPS plugin  

Bez tohto checkout často nepustí ďalej alebo ukáže 0 možností dopravy.

---

## 4. Platby 🔴

| Brána | Zapnutá |
|-------|---------|
| Bankový prevod (BACS) | ❌ nie |
| Šek | ❌ nie (pre SK zbytočné) |
| Dobierka (COD) | ❌ nie |
| Stripe / GoPay / PayPal | **nie sú** |

**Minimálne na štart:**
1. Zapnúť **Bankový prevod** + číslo účtu IBAN  
2. Alebo **Dobierka** (ak doručuješ kuriérom)  
3. Neskôr: **Stripe** / **GoPay** (karty)

Bez aspoň 1 zapnutej platby = checkout nekompletny.

---

## 5. Účty a súkromie

| Nastavenie | Hodnota | Stav |
|------------|---------|------|
| Nákup bez registrácie (guest) | **yes** | ✅ ideálne na štart |
| Registrácia z checkoutu | no | ✅ OK |
| Registrácia na Môj účet | no | ✅ OK (môžeš zapnúť neskôr) |
| GDPR texty | default SK s `[privacy_policy]` | 🟡 priraď stránku Ochrana osobných údajov |
| Vymazanie dát pri erasure | no | 🟡 GDPR: zváž áno podľa procesu |

---

## 6. E-maily

| Nastavenie | Hodnota | Stav |
|------------|---------|------|
| From name | GrowMedica | ✅ |
| From address | **info@growmedica.sk** | 🟡 skôr `info@growmedica.cz` ak je to hlavná doména |
| Farby | default | ✅ |

**Kritické:** na WebSupport over, či e-maily z PHP **odchádzajú** (SMTP plugin / WebSupport mail).  
Bez SMTP často „objednávka sa vytvorí, e-mail nepríde“.

---

## 7. Integrácia

Žiadne dôležité polia / prázdne — **OK** pre teraz (žiadny Mailchimp atď.).

---

## 8. Viditeľnosť stránky

| | |
|--|--|
| Coming soon | **no** ✅ |
| Store pages only | **no** ✅ |

Obchod je **live** (nie „Už čoskoro“ pre verejnosť). Badge v admin bare môže ostať ako skratka do nastavení.

---

## 9. Predajné miesto (POS)

Feature **point_of_sale** = yes v pokročilých.  
Pre čistý online shop: **vypni POS**, ak ho nepoužívaš (menej šumu v admin).

---

## 10. Pokročilé ✅

| Stránka | ID | URL slug | Stav |
|---------|-----|----------|------|
| Košík | 9 | `/kosik` | ✅ |
| Pokladňa | 10 | `/kontrola-objednavky` | ✅ |
| Môj účet | 11 | `/moj-ucet` | ✅ |
| Obchodné podmienky | **prázdne** | — | 🟡 priraď stránku VOP |

Ostatné endpointy default — OK.  
Tracking / marketplace suggestions: môžeš vypnúť (`woocommerce_allow_tracking`, `show_marketplace_suggestions`).

---

## 11. Dane 🟡

| | |
|--|--|
| `calc_taxes` | **no** |
| Ceny s DPH | no / display excl |

Pre **SK e-shop B2C** typicky:
- Zapnúť dane  
- Sadzba **20 %** (štandard)  
- Ceny v katalógu buď „vrátane DPH“ (bežnejšie pre B2C) alebo jasný suffix „bez DPH“

Ak fakturuješ ako neplátca / špeciálny režim — nechaj vypnuté a konzultuj účtovníka.

---

## Prioritný checklist (v admin UI)

Choď na `wc-settings` a sprav v tomto poradí:

### P0 — bez toho nie je predaj
1. **Platby** → zapni Bankový prevod (IBAN) a/alebo Dobierka  
2. **Doprava** → zóna Slovensko + flat rate (€)  
3. **Všeobecné** → adresa obchodu (ulica, mesto, PSČ)

### P1 — legálne / dôvera
4. **Pokročilé** → stránka Obchodné podmienky  
5. **Účty** → privacy policy odkaz na reálnu stránku  
6. **E-maily** → from `info@growmedica.cz` + test SMTP  

### P2 — doladenie
7. **Dane** — podľa plátcu DPH  
8. **Všeobecné** — predaj len SK/CZ  
9. Vypnúť POS / tracking ak nechceš  

---

## Prepojenie s Next.js (už hotové)

| | |
|--|--|
| Katalóg | `CMS_PROVIDER=wordpress` na www |
| Košík Next | cookie-perzistentný |
| Checkout URL | `https://cms.growmedica.cz/kontrola-objednavky/` |

Po zapnutí **platby + dopravy** otestuj:  
www produkt → košík → „Pokračovať do pokladne“ → vyplniť údaje → objednávka.

---

## Raw dump

Technický JSON: `reports/WOOCOMMERCE_SETTINGS_AUDIT.json`

---

## Čo môžem spraviť ja ďalej (ak povieš)

- REST/API: zapnúť **BACS** + **COD** (ty doplníš IBAN text)  
- Vytvoriť shipping zónu **SK + flat rate** (cenu ty určíš, napr. 3.90)  
- Doplniť store address ak pošleš adresu  

**Bez tvojich firiemných údajov (adresa, IBAN, cena dopravy) nastavenia P0 nedokončím naplno.**
