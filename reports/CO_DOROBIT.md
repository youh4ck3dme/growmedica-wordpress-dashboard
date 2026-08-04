# Čo dorobiť — GrowMedica

**Kanónický súhrn nedokončených vecí.**  
**Aktualizované:** 2026-08-04  

> **AI agent:** plný backlog je v [../README.md § AI AGENT](../README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29).

| Súvisiace | |
|-----------|--|
| AI Agent backlog | [../README.md](../README.md) (hore) |
| Ľudský checklist (majiteľ) | [../majitel.md](../majitel.md) |
| Technický stav | [../STATUS.md](../STATUS.md) · [../TODO.md](../TODO.md) |
| Merchant API | [../docs/MERCHANT_KEYS.md](../docs/MERCHANT_KEYS.md) |
| Deploy | [../PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) |
| SuperFaktúra verify | [SUPERFAKTURA_GO_LIVE_VERIFY.md](./SUPERFAKTURA_GO_LIVE_VERIFY.md) |
| Dashboard | [../storefront/docs/DASHBOARD_PANELS.md](../storefront/docs/DASHBOARD_PANELS.md) · [../storefront/docs/DASHBOARD_AGENT.md](../storefront/docs/DASHBOARD_AGENT.md) |

---

## Hotové — neopakovať

| Oblasť | Stav |
|--------|------|
| E-shop www + Woo katalóg, košík, checkout cms | ✅ |
| Firma, IBAN, SMTP, BACS + COD, doprava SK, free od 50 € | ✅ |
| VOP / GDPR stránky (základ); VOP DPH text = neplatca | ✅ |
| SuperFaktúra plugin 1.53.2 + BACS/COD defaults + `sf-status` | ✅ |
| Skripty: `load-wp-prod-env`, `set-superfaktura-api-from-env`, `smoke-superfaktura-30`, `smoke-superfaktura-bacs-order` | ✅ |
| CMS firma/IBAN overené voči [vzorfirma.md](../docs/vzorfirma.md) | ✅ |
| DPH interim: **neplatca** → Woo `calc_taxes: no` | ✅ zámerne |
| Shop **už predáva** cez bankový prevod a dobierku | ✅ |
| Krajiny CZ / AT / HU / PL (sell + ship, EUR) | ✅ 2026-07-19 · [WOO_KRAJINY…](./WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md) |
| **`/dashboard` + AI agent na WooCommerce** (nie Shopify) | ✅ 2026-07-19 · panely, `list_orders`, inventory, apply copy/SEO, bulk prices · prod smoke OK |
| Shopify runtime v storefronte | ✅ odstránený |
| Homepage Finder merge + Pro Max full-bleed | ✅ 2026-07-28 (`26bcf3f`) |
| i18n CS/SK/EN/DE shop + AI finder | ✅ |

---

## P0 — storefront customer launch (agent)

| # | Čo | Kto | Blokuje | Detail |
|---|-----|-----|---------|--------|
| A1 | **Reálna auth** `/prihlasenie` + `/profil` | ✅ agent | Woo BFF · [AUTH.md](../storefront/docs/AUTH.md) |
| A2 | **Analytics** GTM/GA4/Pixel + consent | ✅ wiring | majiteľ IDs → Vercel |
| A3 | Meta title prihlásenie/profil/obľúbené | ✅ agent | `metadata` export |
| A4 | Wishlist rozhodnutie + implementácia | agent | localStorage-only | README § AI AGENT |
| A5 | Dead CSS `.why-growmedica__*` | agent | dead code | `globals.css` |

---

## P0 — pred ostrým marketingom / faktúrami

| # | Čo | Kto | Blokuje | Návod |
|---|-----|-----|---------|--------|
| 1 | Manuálny E2E nákup (1× + 2× SKU, BACS) | majiteľ | dôvera UX + e-mail | [majitel.md §1](../majitel.md#1-manuálny-test-nákupu) |
| 2 | **SuperFaktúra API** (2a–2j) + Test connection | majiteľ | PDF faktúry / proforma | [majitel.md §2](../majitel.md#2-superfaktúra--automatické-faktúry) |
| 3 | Po API: full smoke + BACS PDF | agent | ostré doklady | `./scripts/smoke-superfaktura-30.sh` · `./scripts/smoke-superfaktura-bacs-order.sh` |
| 4 | Kontrola PDF v SF (číslo, DPH, IBAN, e-mail) | majiteľ **2k** | go-live faktúr | po bode 3 |

**Live blokátor SuperFaktúry:** `api_email_set` / `api_key_set` na cms ešte majiteľ.

Bez Stripe/GoPay ide predaj **BACS + COD**. Bez SF API shop funguje, len **bez automatických PDF**.

---

## P1 — merchant API a dáta

| # | Čo | Kto | Návod |
|---|-----|-----|--------|
| 5 | Telefón na web | majiteľ | [majitel.md §3](../majitel.md) |
| 6 | Stripe (karta) | majiteľ → agent | [MERCHANT_KEYS §2](../docs/MERCHANT_KEYS.md#2-stripe-debetná--kreditná-karta) |
| 7 | Packeta API (mapa) | majiteľ → agent | [MERCHANT_KEYS §4](../docs/MERCHANT_KEYS.md#4-packeta-zásielkovňa) |
| 8 | DPD API | majiteľ → agent | [MERCHANT_KEYS §5](../docs/MERCHANT_KEYS.md#5-dpd) |
| 9 | GoPay (voliteľné) | majiteľ | [MERCHANT_KEYS §3](../docs/MERCHANT_KEYS.md#3-gopay) |
| 10 | Reálny sklad (CSV sku/qty) | majiteľ → agent bulk | [majitel.md §8](../majitel.md) |

---

## P2 — právne / účet / neskôr

| # | Čo | Poznámka |
|---|-----|----------|
| 11 | DPH / IČ DPH | Dnes **neplatca** (interim). Ak platca → účtovník + agent zapne Woo dane |
| 12 | Plné VOP (právnik) | Základ už je; schválený text podľa potreby |
| 13 | Vypnúť Shopify merchant účet | Storefront + dashboard už Woo-only; účet zrušiť po stabilite |
| 14 | CZ/AT/HU/PL zóny + DPH sadzby (neplatca) | ✅ 2026-07-19 — [report](./WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md) |
| 15 | Dashboard Shopify → WordPress | ✅ 2026-07-19 |

---

## Agent — technický backlog (nie majiteľ)

**P0:** auth, analytics (pozri tabuľku vyššie)  
**P1:** meta titles, wishlist, dead CSS  
**P2:** Woo e-maily branding, reviews, search UX, facets E2E, Lighthouse `/produkty`  
**P3:** theme switcher, blog/B2B form, Upstash Redis  

Detail: [../TODO.md](../TODO.md) · [../README.md § AI AGENT](../README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29)

---

## Odporúčané poradie

```text
1) Agent: reálna auth + analytics (po GTM IDs od majiteľa)
2) Manuálny BACS nákup na www
3) SuperFaktúra: profil firmy + API → Woo → Test → „API vložené, otestuj“
4) Agent: smoke + BACS proforma/faktúra → majiteľ 2k
5) Stripe test → Packeta/DPD
6) Telefón / sklad / Shopify merchant off
```

**Ľudsky celý checklist:** [../majitel.md](../majitel.md)
