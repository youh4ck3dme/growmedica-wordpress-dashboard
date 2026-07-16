# GrowMedica SEO Taxonomy (pavúk)

Generované: `2026-07-16T23:31:08Z` · schema `1.0.0`  
Zdroj: sitemap/host `https://growmedica.sk` (680 URL).

## Súbory

| Súbor | Účel |
|-------|------|
| `growmedica-seo-taxonomy.xlsx` | 8 listov: Overview, Source URLs, SEO Tree, Categories, Product Mapping, Category SEO, Redirects, QA |
| `growmedica-seo-menu-tree.json` | Strojovo čitateľný strom (kategórie, produkty, redirecty, SEO draft) |

**Scope:** len `reports/seo-taxonomy/`. Storefront, WooCommerce ani live redirecty **neboli** zmenené.

## Overené počty (2026-07-17)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Source URLs | 680 | 680 | PASS |
| Explicit categories | 199 | 199 (`explicit_sitemap_category`) | PASS |
| Inferred ancestors | 14 | 14 (`inferred_from_product_path`) | PASS |
| Categories total | 213 | 213 (199+14) | PASS |
| Unique products / slugs | 464 | 464 / 464 | PASS |
| Redirects (301) | 663 | 663 | PASS |
| Orphan products | 0 | 0 | PASS |
| Orphan category parents | 0 | 0 | PASS |
| Redirect source collisions | 0 | 0 | PASS |
| Redirect loops / self | 0 | 0 | PASS |
| Excel sheets | 8 | 8 | PASS |
| Formula `#REF!` | 0 | 0 | PASS |
| SK/CS/EN/DE labels na kategóriách | full | 0 missing label cells | PASS |

Excel list **QA** má všetky count checks = `PASS` (zhoda s JSON).

## Index / menu odporúčania

| `indexRecommendation` | Count |
|----------------------|------:|
| `HOLD / HIDDEN / NOINDEX` | 186 |
| `INDEX CANDIDATE` | 17 |
| `THIN / NOINDEX` | 10 |

| `menuVisibility` | Count |
|------------------|------:|
| `landing_page_only` | 173 |
| `global_l1_l2` | 40 |

Category SEO draft riadky: **68** (= 17 INDEX CANDIDATE × 4 locales), status `EDITORIAL REVIEW`.

## Riziká / review fronta

| Flag | Count | Poznámka |
|------|------:|----------|
| `manual_category_review` (produkty) | **428** | väčšina s `confidence=0.55` a reason `broad_source_category_manual_review` — sitemap len široký rodič |
| `medical_content_review` (kategórie) | **45** | health_goal / medical copy |
| `medical_context_review` (produkty) | 17 | |
| `inferred_node_review` | 14 | odvodené rodiče |
| `translation_review` | 3 | |

## Nájdený drobný gap (oproti QA „Empty localized category URLs = 0“)

2 inferred uzly **nemajú** `localizedPaths` pre žiadnu locale (8 buniek):

- `cat-200` Webshop (`inferred_from_product_path`)
- `cat-201` Zdravotné ciele (`inferred_from_product_path`)

Ostatné kategórie majú SK/CS/EN/DE paths. Pred importom doplniť alebo tieto 2 uzly neindexovať / neexportovať do menu.

## Next steps

1. Ručne spresniť **428** produktov s `manual_category_review` (najprv leaf kategórie, nie `…/zdravie` / `…/doplnky-vyzivy`).
2. Editorial/medical review SEO draftov pre 17 INDEX CANDIDATE.
3. Až potom: JSON → mega-menu / Woo category import / 301 map (mimo tohto reportu).

## Rollback

Zmazať adresár `reports/seo-taxonomy/`.
