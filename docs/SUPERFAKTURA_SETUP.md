# SuperFaktúra × WooCommerce (cms.growmedica.cz)

**Plugin:** [SuperFaktúra WooCommerce](https://wordpress.org/plugins/woocommerce-superfaktura/) (`woocommerce-superfaktura`)  
**Verzia na CMS:** **1.53.2** (aktívny)  
**Admin UI:** [WooCommerce → Settings → SuperFaktúra](https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=superfaktura)  
**Oficiálne návody (SK):** [inštalácia](https://www.superfaktura.sk/blog/superfaktura-a-woocommerce-diel-1-instalacia-a-autorizacia/) · [vytváranie faktúr](https://www.superfaktura.sk/blog/superfaktura-a-woocommerce-diel-2-vytvaranie-faktur/)

> **Spolu s Packeta / Stripe / GoPay / DPD:** skrátený handoff je v **[MERCHANT_KEYS.md](./MERCHANT_KEYS.md)** (odtiaľ začni, ak hľadáš „čo mám ešte ja“).

Zip archívy (gitignored): `docs/plugins/woocommerce-superfaktura-1.53.2.zip`

---

## Stav (agent)

| Krok | Stav |
|------|------|
| Stiahnutie zip + lokálny extract | ✅ `docs/plugins/` + `wordpress-data/wp-content/plugins/` |
| Inštalácia + aktivácia na cms | ✅ `woocommerce-superfaktura` 1.53.2 **active** |
| Odporúčané defaulty (bez secrets) | ✅ Code Snippet *GrowMedica SuperFaktura defaults* |
| API e-mail / API key / Company ID | ⏳ **ty** (Tools → API v SuperFaktúre) |
| Smoke: test order → faktúra | ⏳ po API credentials |

---

## 1. Čo plugin robí

- Automaticky vytvára **zálohovú** / **ostrú** faktúru v SuperFaktúre podľa stavu objednávky a platobnej brány.
- Link na PDF v e-maile Woo, detail objednávky, Môj účet.
- Polia **firma / IČO / DIČ / IČ DPH** na checkout (classic + blocks).
- Dobropisy pri refundácii, VIES overenie IČ DPH (EU B2B).

Firemné údaje dodávateľa (GrowMedica s.r.o.) musia byť **v profile SuperFaktúry** — plugin ich ťahá z API, nie z `vzorfirma.md`.  
Referencia firmy v repo: [vzorfirma.md](./vzorfirma.md).

---

## 2. Inštalácia / reaktivácia

### A) WordPress.org cez REST (odporúčané)

```bash
# z koreňa monorepa
set -a; source wordpress-production.local.env; set +a
# WORDPRESS_BASE_URL musí byť https://cms.growmedica.cz (nie localhost)
export WORDPRESS_BASE_URL=https://cms.growmedica.cz
./scripts/install-superfaktura-cms.sh
```

Skript:

1. Overí / nainštaluje slug `woocommerce-superfaktura` (WP.org).  
2. Aktivuje plugin.  
3. Nasadí snippet defaultov + REST status.  
4. Vypíše `/wp-json/growmedica/v1/sf-status` (bez secrets).

### B) Zip (offline / pin verzie)

1. Zip: `docs/plugins/woocommerce-superfaktura-1.53.2.zip`  
2. WP Admin → Plugins → Add New → Upload  
3. Activate **SuperFaktúra WooCommerce**

### C) WP-CLI (SSH WebSupport)

```bash
wp --path=growmedica.cz/sub/cms plugin install woocommerce-superfaktura --activate
# alebo z zipu:
wp --path=growmedica.cz/sub/cms plugin install ./woocommerce-superfaktura-1.53.2.zip --activate
```

---

## 3. API credentials (povinné na tvojej strane)

Skrátená kópia v handoff hub: [MERCHANT_KEYS.md § SuperFaktúra](./MERCHANT_KEYS.md#1-superfaktúra-pdf-faktúry--proforma).

1. Prihlás sa do [moja.superfaktura.sk](https://moja.superfaktura.sk/)  
   (firma je SK — **SuperFaktura.sk**, nie `.cz`, pokiaľ nemáte CZ účet).  
2. **Nástroje → API** (`/api_access`) — skopíruj:
   - **API e-mail** (login e-mail do SF)
   - **API kľúč**
   - **Company ID** (ak máš viac firiem v účte)
3. CMS: **WooCommerce → Nastavenia → SuperFaktúra** (tab Authorization):
   - Version: **SuperFaktura.sk**
   - Sandbox: **off** (produkcia)
   - API Email / API Key / Company ID
4. Klikni **Test API connection** — musí byť OK.
5. Voliteľne: Logo ID, Bank Account ID (z SF profilu).

**Nikdy** nedávaj API key do gitu, do `STATUS.md` ani do Vercel env.  
Voliteľný lokálny mirror (gitignored): `wordpress-production.local.env`:

```bash
# len poznámka pre ops — plugin číta options v WP, nie tieto env
# SUPERFAKTURA_API_EMAIL=...
# SUPERFAKTURA_API_KEY=...
# SUPERFAKTURA_COMPANY_ID=...
```

Vyžaduje **Premium** (alebo trial) účet SuperFaktúry s API prístupom.

---

## 4. Odporúčané pravidlá (GrowMedica)

Aktívne brány dnes: **BACS** (bankový prevod), **COD** (dobierka).

| Brána | Zálohová (proforma) | Ostrá faktúra | Poznámka |
|-------|---------------------|---------------|----------|
| **bacs** | pri `on-hold` | pri `processing` (ako paid) | po pripísaní peňazí zmeň status → processing |
| **cod** | nevytvárať | pri `processing` (nie paid) | paid až po doručení / complete podľa tvojho procesu |
| stripe / gopay | neskôr: proforma off, regular pri `processing` + paid | keď zapneš bránu |

Ďalšie defaulty snippetu:

- `woocommerce_sf_lang` = `sk`
- firemné polia na checkoute = **yes**
- manuálne vytvorenie faktúry / proforma = **yes** (metabox v objednávke)
- `prevent_concurrency` = yes (GoPay-safe)
- `retry_failed_api_calls` = yes

Úprava: **Woo → SuperFaktúra → Invoice creation** (alebo znova spusti snippet s flag reset — pozri skript).

---

## 5. Overenie

### Status endpoint (Application Password)

```bash
set -a; source wordpress-production.local.env; set +a
export WORDPRESS_BASE_URL=https://cms.growmedica.cz
curl -sS -u "$WORDPRESS_ADMIN_USER:$WORDPRESS_APP_PASSWORD" \
  "$WORDPRESS_BASE_URL/wp-json/growmedica/v1/sf-status" | python3 -m json.tool
```

Očakávané po plnej konfigurácii:

```json
{
  "plugin_active": true,
  "plugin_version": "1.53.2",
  "lang": "sk",
  "sandbox": false,
  "api_email_set": true,
  "api_key_set": true,
  "company_id_set": true,
  "defaults_applied": true
}
```

### Manuálny smoke

1. Test order (BACS) na cms checkout.  
2. Status `on-hold` → v SuperFaktúre **zálohová**.  
3. Prepnúť na `processing` → **faktúra** (paid).  
4. V objednávke Woo: metabox **Invoices** + link v e-maile zákazníkovi.

---

## 6. Headless storefront

- Fakturácia beží **len na cms** (Woo order lifecycle).  
- Next.js storefront **nemusí** volať SuperFaktúra API.  
- Checkout polia firma/IČO pridáva plugin na **cms** `/kontrola-objednavky`.  
- UI storefrontu sa **nemeni** (UI freeze).

---

## 7. Troubleshooting

| Problém | Riešenie |
|---------|----------|
| Faktúra nevznikne | API email = login e-mail SF; skontroluj Invoice creation statusy |
| API test fail | Premium/trial, správna verzia sk vs cz, sandbox off |
| Zmenil si login e-mail v SF | aktualizuj API Email v Woo settings |
| Denný API limit | SF → doobjednať API limit |
| Duplicitné doklady (GoPay) | `prevent_concurrency` = yes |

Support pluginu: superfaktura@2day.sk · [integrácia](https://www.superfaktura.sk/integracia/)

---

*Aktualizované: 2026-07-17*
