# Audit skladu (Woo) — 2026-07-16

**Zdroj:** Woo REST published products (460).

| Metrika | Hodnota |
|---------|---------|
| Publish produktov | 460 |
| In stock | ~400 |
| Out of stock | ~60 |
| `stock_quantity === 50` | **~397** (väčšina) |

## Záver

Import zo Shopify nastavil **fiktívne množstvo 50** takmer všade.  
To **nie je reálny sklad** — pred ostrým predajom treba:

1. Export skladu z reality (sklad/ERP/Excel), alebo  
2. V Woo admin nastaviť skutočné qty, alebo  
3. Dočasne `manage_stock = false` na produktoch, ktoré sa nesledujú.

**Agent neurobil bulk zmenu qty** — bez reálnych dát by to skreslilo predaj.

## Ako opraviť neskôr

```bash
# manuálne v cms, alebo skript po dodaní CSV mapy sku → qty
```
