# GrowMedica — čo potrebuje majiteľ dodať

**Pre koho:** majiteľ firmy / prevádzkovateľ e-shopu (nie developer).  
**Jazyk:** jednoduché body — *čo*, *kde získaš*, *kam vložiť* / *komu poslať*.  
**Dátum:** 2026-07-17  

| Odkaz | |
|-------|--|
| E-shop (zákazník) | https://www.growmedica.cz |
| CMS admin (WordPress) | https://cms.growmedica.cz/wp-admin |
| Login CMS | e-mail `info@growmedica.cz` (heslo máš ty / WebSupport) |
| Technický detail pre AI | [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md) |
| Firma / IBAN | [docs/vzorfirma.md](./docs/vzorfirma.md) |

---

## Čo už funguje (nemusíš riešiť)

- E-shop na **www.growmedica.cz** (katalóg z WooCommerce)
- Košík → pokladňa na **cms**
- **Bankový prevod** (BACS) + **dobierka** (COD)
- Doprava SK s cenami (DPD / Packeta flat rate, zdarma od 50 €)
- Firemné údaje, IČO, DIČ, IBAN, e-maily (SMTP)
- Plugin **SuperFaktúra** nainštalovaný (chýba len tvoj API kľúč)
- Pluginy Packeta, DPD, Stripe, GoPay nainštalované (chýbajú merchant prístupy)

**Shop už vie predávať** cez prevod a dobierku. Nižšie body sú vylepšenia a povinné veci na tvojej strane.

---

## Rýchly prehľad — checklist majiteľa

Odškrtávaj:

### Priorita 1 — urob čo najskôr

- [ ] **1. Manuálny test nákupu** (over, že ti príde e-mail a objednávka v adminu)
- [ ] **2. SuperFaktúra API** (automatické faktúry / zálohové)
- [ ] **3. Telefónne číslo** na web (ak ho chceš zverejniť)

### Priorita 2 — platby kartou a doprava „na mapu“

- [ ] **4. Stripe** (debetná / kreditná karta) — najprv test, potom live
- [ ] **5. Packeta** API (výber výdajne na mape)
- [ ] **6. DPD** API (parcelshop / labels) — podľa zmluvy
- [ ] **7. GoPay** (voliteľná alternatíva ku Stripe)

### Priorita 3 — dáta a právne

- [ ] **8. Reálny sklad** (Excel/CSV: sku + množstvo)
- [ ] **9. DPH / IČ DPH** (ak ste platcovia DPH — rozhodnutie s účtovníkom)
- [ ] **10. Plné VOP** (právnik, ak treba doplniť text)
- [ ] **11. Potvrdenie: vypnúť Shopify** (až keď je Woo stabilné)

---

## 1. Manuálny test nákupu

**Prečo:** overenie celej cesty v reálnom prehliadači (nie len robot).

**Čo urobíš:**

1. Otvor https://www.growmedica.cz  
2. Pridaj **1 produkt** do košíka → Pokladňa  
3. Dokonči objednávku **Bankovým prevodom** (môžeš dať testovaciu adresu)  
4. Skontroluj:
   - e-mail v schránke `info@growmedica.cz`
   - objednávku v https://cms.growmedica.cz/wp-admin → WooCommerce → Objednávky  
5. (Voliteľne) zopakuj s **2 rôznymi produktmi** v jednom košíku  

**Kam to nahlásiš:** agentovi / vývojárovi napíš „E2E nákup OK“ alebo čo nefungovalo (screenshot).

---

## 2. SuperFaktúra — automatické faktúry

**Prečo:** zálohové a ostré PDF faktúry z každej objednávky.

| | |
|--|--|
| **Čo potrebuješ** | API e-mail, API kľúč, Company ID |
| **Kde to získaš** | https://moja.superfaktura.sk/ → **Nástroje → API** (menu Tools / API access) |
| **Kam to vložíš** | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=superfaktura |
| **Nastavenie** | Version = **SuperFaktura.sk** · Sandbox = **vypnuté** · potom **Test API connection** |

**Kroky bodovo:**

1. Prihlás sa do SuperFaktúry (účet firmy GrowMedica s.r.o.).  
2. Choď do **Nástroje → API**.  
3. Skopíruj: **e-mail**, **API key**, **Company ID** (ak ho ukazuje).  
4. Otvor odkaz CMS vyššie (WooCommerce → Nastavenia → SuperFaktúra).  
5. Vlož údaje → **Uložiť** → **Test API connection** musí byť zelené / OK.  

**Poznámka:** často treba **Premium** (alebo trial) účet SuperFaktúry s API.  
**Nikdy** nedávaj API kľúč do e-mailu verejne ani do GitHubu — stačí ho vložiť do CMS, alebo napísať agentovi „hotovo, otestuj“.

Detail pre tech: [docs/SUPERFAKTURA_SETUP.md](./docs/SUPERFAKTURA_SETUP.md)

---

## 3. Telefónne číslo na web

**Prečo:** na webe zatiaľ **nie je** zverejnené reálne číslo (zámerne).

| | |
|--|--|
| **Čo potrebuješ** | Reálne mobilné / pevnú linku (napr. +421 …) |
| **Kde to získaš** | Tvoj telefón / firemná linka |
| **Kam to pošleš** | Agentovi / do chatu — doplníme na kontakt, faktúry, footer |

Stačí jedna veta: *„Telefón na web: +421 9xx xxx xxx“*.

---

## 4. Stripe — platba kartou (debetná / kreditná)

**Prečo:** zákazník zaplatí kartou online (nielen prevod / dobierka).

| | |
|--|--|
| **Čo potrebuješ** | **Publishable key** + **Secret key** (najprv **Test**, potom **Live**) |
| **Kde to získaš** | https://dashboard.stripe.com/ → **Developers → API keys** |
| **Kam to vložíš** | CMS: **WooCommerce → Settings → Payments → Stripe** (alebo menu Stripe) |

**Kroky bodovo:**

1. Založ / otvor účet Stripe (firma GrowMedica).  
2. Dokonči overenie firmy (KYC), ak Stripe žiada.  
3. V **Test mode** skopíruj kľúče.  
4. Vlož do Woo Stripe nastavení na cms → ulož → zapni metódu.  
5. Agent otestuje testovacou kartou `4242…`.  
6. Až potom prepni na **Live** kľúče.  

**Secret key** nepatrí na Vercel public env — len do Woo/Stripe na cms.

---

## 5. Packeta (Zásielkovňa) — mapa výdajní

**Prečo:** zákazník si na pokladni vyberie výdajné miesto / Z-BOX na mape.  
*(Cena dopravy „Packeta“ už na webe je; chýba prepojenie na tvoj Packeta účet.)*

| | |
|--|--|
| **Čo potrebuješ** | **API heslo** + údaje **odosielateľa** (meno, adresa, telefón) |
| **Kde to získaš** | https://client.packeta.com/ (klientska zóna Packeta / Zásielkovňa) — sekcia API / nastavenia e-shopu |
| **Kam to vložíš** | CMS: **WooCommerce → Settings → Packeta** (alebo menu Packeta) |

**Kroky bodovo:**

1. Prihlás sa do Packeta klienta.  
2. Nájdi **API password** / kľúč pre e-shop.  
3. Over údaje odosielateľa (odkiaľ sa balíky posielajú).  
4. Vlož do pluginu Packeta na cms → ulož.  
5. Napíš agentovi „Packeta hotovo“ — overí mapu na checkoute.  

---

## 6. DPD — parcelshop / API

**Prečo:** mapa Pickup / labels podľa vašej zmluvy s DPD.  
*(Flat rate „DPD kuriér / odberné“ už majú ceny; API je navyše.)*

| | |
|--|--|
| **Čo potrebuješ** | Prihlasovacie / API údaje z **DPD zmluvy** (login, heslo, Delis ID… — podľa toho, čo dá DPD) |
| **Kde to získaš** | Partner portál DPD / shipper účet (podľa zmluvy s DPD Slovensko) |
| **Kam to vložíš** | CMS: nastavenia pluginu **DPD pre WooCommerce** |

Bez zmluvy s DPD sa API nedá „vymyslieť“ — treba obchodnú zmluvu.

---

## 7. GoPay (voliteľné)

**Prečo:** ďalšia online platobná brána (SK/CZ), ak nechceš len Stripe.

| | |
|--|--|
| **Čo potrebuješ** | Merchant prístup: GoID / client ID / client secret (podľa portálu) |
| **Kde to získaš** | https://www.gopay.com / merchant / partner panel |
| **Kam to vložíš** | CMS: **WooCommerce → Settings → Payments → GoPay** |

Ak stačí Stripe, GoPay môžeš odložiť.

---

## 8. Reálny sklad (množstvá produktov)

**Prečo:** v systéme majú produkty často fiktívnych **50 ks** — treba skutočné stavy.

| | |
|--|--|
| **Čo potrebuješ** | Tabuľka / Excel / CSV: stĺpce **sku** (alebo názov) + **qty** |
| **Kde to získaš** | Tvoj sklad / dodávatelia / účtovníctvo |
| **Kam to pošleš** | Agentovi súbor (CSV/XLSX) — vie hromadne nahrať do Woo |

Príklad riadku:

```text
sku,qty
MY010HUBPRS,12
```

---

## 9. DPH / IČ DPH

**Prečo:** či ste **platca DPH**, sadzby (napr. 20 %), IČ DPH na faktúrach.

| | |
|--|--|
| **Čo potrebuješ** | Rozhodnutie od **účtovníka** + IČ DPH (ak máte) |
| **Kde to získaš** | Účtovník / FÚ |
| **Kam to nahlásiš** | Agentovi + nastaviť v SuperFaktúre (profil firmy) a v Woo daniach |

Bez tohto nechávame ceny ako doteraz (neplynie z toho automaticky 20 % DPH na webe).

---

## 10. Plné VOP / právne texty

**Prečo:** na webe sú stránky VOP / GDPR / reklamácie; plný právny text schvaľuje **právnik**.

| | |
|--|--|
| **Čo potrebuješ** | Schválený text VOP (a prípadne úpravy GDPR / reklamácií) |
| **Kde to získaš** | Právnik / generátor zmluvných podmienok pre e-shop SK/CZ |
| **Kam to pošleš** | Agentovi (Word/PDF/text) — nahrá na cms / storefront stránky |

---

## 11. Vypnúť Shopify (neskôr)

**Prečo:** shop beží na **WordPress/Woo**. Shopify ostáva ako záloha / import.

| | |
|--|--|
| **Čo potrebuješ** | Tvoje **áno** po tom, čo je Woo stabilné (nákupy, faktúry, doprava) |
| **Kam** | Napíš agentovi: *„Shopify môžeme vypnúť / nechať len ako archív“* |

Nerobiť skôr, kým neprejdeš Prioritu 1–2.

---

## Odporúčané poradie (1–2 týždne)

```text
1) Test nákupu na www (prevod)
2) SuperFaktúra API          → faktúry
3) Telefón na web
4) Stripe test keys          → karty
5) Packeta API               → mapa výdajní
6) DPD API (ak máš zmluvu)
7) Sklad CSV
8) DPH / VOP podľa potreby
9) Stripe live + GoPay voliteľne
10) Schválenie: Shopify off
```

---

## Ako bezpečne odovzdať údaje

| Áno | Nie |
|-----|-----|
| Vložiť priamo do **cms wp-admin** a napísať „hotovo“ | Commitnúť heslá do gitu / GitHubu |
| Poslať agentovi v súkromnom chate len na setup | Verejný Discord / ticket s full secret |
| Stripe **najprv test** kľúče | Hneď live karty bez testu |
| SuperFaktúra kľúč len do Woo nastavení | Uložiť API key do README |

Po nastavení **nemusíš** posielať kópie kľúčov ešte raz — stačí „otestuj“.

---

## Kam ísť v CMS (skratky)

| Úloha | Odkaz |
|-------|--------|
| SuperFaktúra | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=superfaktura |
| Platby (Stripe / BACS / COD / GoPay) | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=checkout |
| Objednávky | https://cms.growmedica.cz/wp-admin/admin.php?page=wc-orders |
| Packeta | WooCommerce → Packeta (menu pluginu) |
| DPD | WooCommerce / DPD menu pluginu |

---

## Čo spraví agent po tvojich dodávkach

| Ty dodáš | Agent spraví |
|----------|----------------|
| SuperFaktúra API (vložené / „hotovo“) | Overí spojenie + test faktúry z objednávky |
| Stripe keys | Zapne bránu, test platby, pravidlo faktúry |
| Packeta / DPD API | Doplní config, overí checkout |
| Telefón | Zobrazí na webe + firma |
| CSV skladu | Hromadný update množstiev |
| VOP text | Nasadí na stránky |
| „Shopify off“ | Odpojí legacy podľa plánu |

---

## Jedna strana — čo od teba chceme (skopíruj a odškrtávaj)

```text
MAJITEĽ — GrowMedica checklist
[ ] Test nákup BACS na www.growmedica.cz
[ ] SuperFaktúra: API e-mail + key (+ company id) → Woo SuperFaktúra → Test OK
[ ] Telefón na web: +___
[ ] Stripe: test keys → Woo Payments
[ ] Packeta: API heslo + odosielateľ
[ ] DPD: API zo zmluvy (ak je)
[ ] GoPay: merchant (voliteľne)
[ ] Sklad: CSV sku,qty
[ ] DPH / IČ DPH (účtovník)
[ ] VOP právnik (ak treba)
[ ] Schválenie Shopify off (neskôr)
```

---

*Tento súbor je pre majiteľa. Technické detaily pre AI/dev: [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md) · stav: [STATUS.md](./STATUS.md).*
