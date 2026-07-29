# GrowMedica — TODO

**Aktualizované:** 2026-07-29  
**AI backlog (kanón):** [README.md § AI AGENT](./README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29)  
**Súhrn čo dorobiť:** [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md)  
**Hlavný stav:** [STATUS.md](./STATUS.md) · **Prevádzka:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)  
**Majiteľ:** [majitel.md](./majitel.md) · SuperFaktúra **2a–2k**

## Hotové (agent + main)

- [x] Woo live na www, cookie cart, multi-SKU checkout seed  
- [x] Security, firma/IBAN/SMTP, BACS+COD, doprava SK  
- [x] SuperFaktúra plugin + defaults + smoke/API skripty (API key ešte majiteľ 2a–2j)  
- [x] CMS firma/IBAN verify + DPH interim neplatca + VOP  
- [x] Menu, facets (vendor / type / effect), mega-menu, bundles  
- [x] Docs MERCHANT_KEYS + majitel.md + CO_DOROBIT  
- [x] Krajiny CZ/AT/HU/PL sell+ship (EUR)  
- [x] `/dashboard` Woo-only — panely + agent tools  
- [x] Shopify runtime cleanup  
- [x] Homepage: Finder merge + reorder + Pro Max full-bleed (`26bcf3f`, 2026-07-28)  
- [x] i18n CS/SK/EN/DE shop UI + AI finder/chat  

## Otvorené — agent (technické, podľa priority)

### P0 — kritické

- [x] **Reálna autentifikácia** — Woo CMS auth + Next BFF (`storefront/docs/AUTH.md`)  
- [x] **Analytics wiring** — `AnalyticsLoader` + consent (vyžaduje GTM/GA4/Pixel ID od majiteľa)  

### P1 — vysoké

- [x] Meta `title` pre `/prihlasenie`, `/profil`, `/oblubene`  
- [ ] Wishlist: localStorage-only vs Woo user meta sync (rozhodnúť + implementovať)  
- [x] Dead CSS cleanup — `.why-growmedica__*` v `globals.css`  

### P2 — stredné

- [ ] Overiť Woo e-mail notifikácie (branding)  
- [ ] Overiť product reviews → Woo  
- [ ] Overiť search UX `/vyhladavanie`  
- [ ] Behavior E2E facets v prehliadači (Playwright)  
- [ ] Performance `/produkty` (Lighthouse)  

### P3 — nice-to-have

- [ ] Theme switcher noor/classic (user-facing?)  
- [ ] Blog obsah / veľkoobchod B2B formulár  
- [ ] Upstash Redis na Vercel (rate-limit / audit)  

## Otvorené — majiteľ (secrets / rozhodnutia)

- [ ] Manuálny E2E nákup (1 + 2 SKU BACS)  
- [ ] SuperFaktúra — majiteľ **2a–2j** ([majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry)); agent potom smoke + BACS PDF  
  Stav: plugin+defaults ✅ · infra ✅ · **`api_*_set: false`** ⏳  
- [ ] GTM / GA4 / Pixel ID (pre agent analytics zapojenie)  
- [ ] Telefón na web  
- [ ] Stripe test/live a/alebo GoPay  
- [ ] Packeta / DPD API  
- [ ] Reálny sklad (CSV)  
- [ ] DPH / VOP právnik podľa potreby (dnes interim neplatca)  
- [ ] Shopify merchant účet vypnúť / zrušiť (storefront už Woo-only)  

## Po dodaní dát agent vie

| Ty dodáš | Agent spraví |
|----------|----------------|
| SuperFaktúra API | `smoke-superfaktura-30.sh` · `smoke-superfaktura-bacs-order.sh` |
| GTM / GA4 / Pixel ID | zapojiť analytics + consent |
| Stripe keys | zapnúť bránu + SF rules |
| Packeta/DPD API | plugin config |
| Telefón | company.ts + deploy |
| CSV sklad | bulk stock update (dashboard agent / Woo REST) |
