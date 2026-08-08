# CMS databázový výpadok — incident report

**Dátum diagnostiky:** 2026-08-07 (UTC)  
**Stav:** 🔴 **AKTÍVNY** (2026-08-08) — runtime secrets pripravené, sync čaká na injekciu do agenta  
**Posledný test:** `test-cms-connection-full.sh` — CMS HTTP 500, production smoke ❌
**Hosting:** WebSupport (`shell.r1.websupport.sk`, WP path `growmedica.cz/sub/cms`)

---

## Symptómy

WordPress na `https://cms.growmedica.cz` vracia HTTP **500** s titulkom **„Chyba databázy“** a správou:

> **Chyba pri nadväzovaní spojenia s databázou**

(`Error establishing a database connection` — štandardná WP chyba, keď PHP nedokáže pripojiť MySQL/MariaDB.)

---

## HTTP stav (2026-08-07T07:47Z)

| Endpoint | HTTP | Poznámka |
|----------|------|----------|
| `cms.growmedica.cz/` | **500** | Chyba databázy |
| `cms.growmedica.cz/wp-json/` | **500** | Chyba databázy |
| `cms.growmedica.cz/wp-json/wc/v3/products` | **500** | Woo REST nefunguje |
| `cms.growmedica.cz/kontrola-objednavky` | **500** | Checkout nefunguje |
| `cms.growmedica.cz/wp-admin/` | **509** | Dočasne nedostupné (WebSupport/openresty) |
| `www.growmedica.cz/` | **200** | Statická/cache stránka OK |
| `www.growmedica.cz/api/products` | **500** | `Failed to fetch products` (závisí od CMS) |
| `www.growmedica.cz/kosik` | **200** | UI OK, checkout redirect zlyhá |
| `www.growmedica.cz/prihlasenie` | **200** | UI OK, auth API zlyhá |
| `www.growmedica.cz/api/dashboard/health` | **200** | `{"ok":true}` — Next proces beží |

**Production smoke:** ❌ zlyhal na `/api/products` (HTTP 500).

**Stabilita API:** 3/3 pokusy na `/api/products?limit=1` → HTTP 500 (nie intermittent cache).

---

## Root cause (technická diagnóza)

| Vrstva | Diagnóza |
|--------|----------|
| **Príčina** | WordPress `wp-config.php` sa nevie pripojiť k MySQL/MariaDB |
| **Typ** | Infra / hosting — **nie bug v Next.js repozitári** |
| **Server** | `openresty` (WebSupport reverse proxy) |
| **Pravdepodobné dôvody** | MySQL služba down · expirovaná DB kvóta · zmenené DB heslo v paneli · nesprávny `DB_HOST` · max connections · disk full |

Agent **nemá** prístup k `wordpress-production.local.env` v cloud VM, pokiaľ nie sú **Runtime Secrets** injikované do `process.env` (tento beh: `environment: null`, DB_* = MISSING).

**Root cause (SSH 2026-08-08):** `Access denied for user '5GckMhNYkGYDr2JK'` — heslo v `wp-config.php` nesedí s WebSupport MySQL panelom.

**Obnova (keď sú runtime secrets v process.env):**

```bash
python3 scripts/cms-db-recover-from-runtime.py
# alebo:
./scripts/bootstrap-runtime-secrets-env.sh
export WEBSUPPORT_SSH_PASS=…  # ak je v runtime secrets
./scripts/sync-wp-config-db-from-env.sh
./scripts/test-cms-connection-full.sh
```

Mu-plugins na CMS doplnené cez SFTP (2026-08-08): `growmedica-checkout-seed.php`, `growmedica-customer-auth.php`, `growmedica-clean-homepage.php`.

---

## Runbook — kroky pre majiteľa / hosting

### 1. WebSupport panel (5 min)

1. Prihlás sa do [WebSupport](https://admin.websupport.sk/) → hosting **growmedica.cz**.
2. **Databázy → MySQL** — skontroluj:
   - databáza existuje a je **aktívna**
   - používateľ má **prístup** k databáze
   - **kvóta / disk** nie je plná
3. Ak panel ukazuje DB ako pozastavenú → **obnov / reaktivuj**.
4. Ak si nedávno menil heslo DB → musíš ho zosúladiť v `wp-config.php` (krok 2).

### 2. SSH + WP-CLI (15 min)

```bash
# Heslo z WebSupport → Shell (platné ~60 min)
export WEBSUPPORT_SSH_PASS='…'
export WEBSUPPORT_SSH_PORT=29267   # aktuálny port z panelu
./scripts/setup-cms-production.sh   # len ak potrebuješ re-deploy mu-plugins
```

Po prihlásení na shell:

```bash
cd growmedica.cz/sub/cms
wp db check
wp config get DB_NAME
wp config get DB_HOST
wp db query "SELECT 1"
```

| Príkaz | Očakávaný výsledok |
|--------|-------------------|
| `wp db check` | `Success: Database checked.` |
| `wp db query "SELECT 1"` | `1` |

Ak `db check` zlyhá → porovnaj `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` v `wp-config.php` s hodnotami v **WebSupport → Databázy**.

### 3. Po obnovení DB — overenie (agent alebo majiteľ)

```bash
# CMS
curl -sI https://cms.growmedica.cz/wp-json/wc/v3/products?per_page=1 | head -3
curl -sI https://cms.growmedica.cz/kontrola-objednavky | head -3

# Storefront
cd storefront
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
# očakávaj: gid://woocommerce/Product/…

# Krajiny (potrebuje wordpress-production.local.env)
source ./scripts/load-wp-prod-env.sh
./scripts/smoke-woo-countries-cz-at-hu-pl.sh
```

### 4. Checkout seed `gm_cart`

Zdroj v repozitári: `wordpress/mu-plugins/growmedica-checkout-seed.php`  
Na CMS: mu-plugin **alebo** Code Snippet (deploy: `./scripts/deploy-cms-snippets.sh`).

Overenie po obnovení CMS:

```bash
# Príklad — nahraď PRODUCT_ID reálnym ID z Woo
curl -sI "https://cms.growmedica.cz/?gm_cart=123:1,456:1&gm_to=checkout" | grep -i location
# očakávaj redirect na /kontrola-objednavky
```

---

## Čo agent nemohol urobiť (chýbajúce credentials)

| Súbor / env | Účel | Stav |
|-------------|------|------|
| `wordpress-production.local.env` | DB, Woo keys, App Password | ❌ chýba v workspace |
| `WEBSUPPORT_SSH_PASS` | SSH na cms | ❌ nenastavené |
| `smoke-woo-countries-cz-at-hu-pl.sh` | Woo krajiny smoke | ⏸️ preskočené (potrebuje `WOO_*`) |

---

## Dopad na biznis

| Funkcia | Dostupnosť počas výpadku |
|---------|--------------------------|
| Prehliadanie homepage (cache) | 🟡 čiastočne |
| Katalóg / produkty (live API) | 🔴 nie |
| Košík → checkout | 🔴 nie |
| Prihlásenie / profil (Woo auth) | 🔴 nie |
| Nové objednávky | 🔴 nie |
| Dashboard agent (list_orders) | 🔴 nie (Woo nedostupné) |

---

## Kontakt support

Ak panel + SSH nevyriešia problém do 30 min → **WebSupport ticket** s textom:

> WordPress na `cms.growmedica.cz` (cesta `growmedica.cz/sub/cms`) hlási „Chyba pri nadväzovaní spojenia s databázou“ (HTTP 500). Prosím skontrolovať stav MySQL databázy, kvótu a pripojenie z wp-config.

---

*Generované agentom pri diagnostike 2026-08-07. Po obnovení CMS aktualizuj [STATUS.md](../STATUS.md) a spusti production smoke.*
