# Čo dorobiť — GrowMedica

**Kanónický súhrn nedokončených vecí** (predtým `REMAINING_WORK_NOW.md`).  
**Aktualizované:** 2026-07-18  

| Súvisiace | |
|-----------|--|
| Ľudský checklist (majiteľ) | [../majitel.md](../majitel.md) |
| Technický stav | [../STATUS.md](../STATUS.md) · [../TODO.md](../TODO.md) |
| Merchant API | [../docs/MERCHANT_KEYS.md](../docs/MERCHANT_KEYS.md) |
| Deploy | [../PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) |
| SuperFaktúra verify | [SUPERFAKTURA_GO_LIVE_VERIFY.md](./SUPERFAKTURA_GO_LIVE_VERIFY.md) |

---

## Hotové — neopakovať

| Oblasť | Stav |
|--------|------|
| E-shop www + Woo katalóg, košík, checkout cms | ✅ |
| Firma, IBAN, SMTP, BACS + COD, doprava SK, free od 50 € | ✅ |
| VOP / GDPR stránky (základ); VOP DPH text = neplatca | ✅ |
| SuperFaktúra plugin 1.53.2 + BACS/COD defaults + `sf-status` | ✅ |
| Skripty: `load-wp-prod-env`, `set-superfaktura-api-from-env`, `smoke-superfaktura-30`, `smoke-superfaktura-bacs-order` | ✅ |
| CMS firma/IBAN overené voči [vzorfirma.md](../docs/vzorfirma.md) (2026-07-18) | ✅ |
| DPH interim: **neplatca** → Woo `calc_taxes: no` → checkout `taxesEnabled: false` | ✅ zámerne |
| Shop **už predáva** cez bankový prevod a dobierku | ✅ |

---

## P0 — pred ostrým marketingom / faktúrami

| # | Čo | Kto | Blokuje | Návod |
|---|-----|-----|---------|--------|
| 1 | Manuálny E2E nákup (1× + 2× SKU, BACS) | majiteľ | dôvera UX + e-mail | [majitel.md §1](../majitel.md#1-manuálny-test-nákupu) |
| 2 | **SuperFaktúra API** (2a–2j) + Test connection | majiteľ | PDF faktúry / proforma | [majitel.md §2](../majitel.md#2-superfaktúra--automatické-faktúry) |
| 3 | Po API: full smoke + BACS PDF | agent | ostré doklady | `./scripts/smoke-superfaktura-30.sh` · `./scripts/smoke-superfaktura-bacs-order.sh` |
| 4 | Kontrola PDF v SF (číslo, DPH, IBAN, e-mail) | majiteľ **2k** | go-live faktúr | po bode 3 |

**Live blokátor SuperFaktúry (2026-07-18):** `api_email_set: false`, `api_key_set: false` na cms.

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
| 13 | Vypnúť Shopify | Až po stabilite Woo + faktúry |
| 14 | CZ zóna / Nexus | nízka priorita |

---

## Agent — technický backlog (nie majiteľ)

- Behavior E2E facets (Playwright)
- Stabilita `yarn test:integrity` na CI
- Performance `/produkty` (Lighthouse)
- Mega-menu banner assets (ak WIP)

Detail: [../TODO.md](../TODO.md)

---

## Odporúčané poradie

```text
1) Manuálny BACS nákup na www
2) SuperFaktúra: profil firmy + API → Woo → Test → „API vložené, otestuj“
3) Agent: smoke + BACS proforma/faktúra → majiteľ 2k
4) Stripe test → Packeta/DPD
5) Telefón / sklad / Shopify off
```

**Ľudsky celý checklist:** [../majitel.md](../majitel.md)
