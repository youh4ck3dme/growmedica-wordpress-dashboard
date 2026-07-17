# Editorial / medical SEO pack (draft)

**Dátum:** 2026-07-17  
**Status:** `EDITORIAL_REVIEW` — nie je publikované do live `categorySeo` freeze (JSON freeze ostáva zamknutý).  
**Jazyk:** SK (primárny), šablóny použiteľné na CS/EN/DE.

## Súbory

| Súbor | Obsah |
|-------|--------|
| `index-candidate-seo-sk.json` | Title / H1 / meta / short intro pre INDEX CANDIDATE kategórie |
| `medical-ymyl-guidelines.md` | Pravidlá copy pre YMYL / zdravotné témy |
| `clanok-doplnky-vyzivy-vyber.md` | Vzorový SEO článok ~1800 slov (H1–H4 max 3× každá úroveň) |

## Zásady (povinné)

1. **Doplnok stravy nie je liek.** Žiadne sľuby liečby, vyliečenia ani nahradenia lekárskej starostlivosti.
2. Preferovať: „podpora“, „doplnenie stravy“, „môže prispieť“, „vhodné zvážiť“, „poradte sa s lekárom/lekárnikom“.
3. Zakázané bez klinického podkladu a právneho OK: „lieči rakovinu“, „vylieči“, „nahradí lieky“, „100 % účinnosť“.
4. Detské / tehotenské / pet produkty: extra opatrnosť + odkaz na odbornú konzultáciu.
5. Meta description: ~150–160 znakov, 1 primárne kľúčové slovo, CTA bez agresívneho zdravotného claimu.
6. Title: brand na konci `| GrowMedica`, max ~60 znakov kde sa dá.

## Next (publikácia)

1. Ľudský medical/legal review tohto packu.  
2. Až potom merge do `growmedica-seo-menu-tree.json` **novou** schema verziou + nový `FREEZE.json` hash.  
3. Neprepisovať freeze 1.1.0 in-place.
