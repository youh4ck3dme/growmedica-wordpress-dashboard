# Editorial / medical SEO pack (draft)

**Dátum:** 2026-07-17  
**Status:** `EDITORIAL_REVIEW` — nie je v live freeze JSON (1.1.0 ostáva zamknutý).  
**Jazyky:** SK · CS · EN · DE  

## Súbory

| Súbor | Obsah |
|-------|--------|
| `medical-ymyl-guidelines.md` | YMYL pravidlá, zakázané claimy, disclaimer |
| `index-candidate-seo-sk.json` | Pôvodný SK pack (33 kategórií) |
| **`index-candidate-seo-i18n-rankmath.json`** | **SK/CS/EN/DE Rank Math meta** pre 33 INDEX CANDIDATE |
| `clanok-doplnky-vyzivy-vyber.md` | SK článok ~1800 slov (H1–H4 max 3×) |
| `clanok-doplnky-vyzivy-vyber.cs.md` | CS preklad článku |
| `clanok-doplnky-vyzivy-vyber.en.md` | EN preklad článku |
| `clanok-doplnky-vyzivy-vyber.de.md` | DE preklad článku |
| **`clanok-rankmath-i18n.json`** | Rank Math title/description/focus keywords + meta tags pre článok (4 locale) |

## Rank Math mapping (WordPress)

| Rank Math field | Zdroj v JSON |
|-----------------|--------------|
| Focus Keyword | `rankMath.focusKeyword` |
| Additional / related KW | `rankMath.additionalKeywords` (comma-join) |
| SEO Title | `rankMath.seoTitle` |
| Meta Description | `rankMath.metaDescription` |
| Robots | `rankMath.robots` → index,follow |
| Canonical | `rankMath.canonicalUrl` |
| Schema | `rankMath.schemaType` (CollectionPage / Article) |
| Social | `openGraph.*` + `twitter.*` |
| Raw `<meta>` list | `metaTags[]` |

### Next.js `metadata` (App Router)

```ts
// example
title: { absolute: rankMath.seoTitle },
description: rankMath.metaDescription,
keywords: [rankMath.focusKeyword, ...rankMath.additionalKeywords],
robots: rankMath.robots,
alternates: { canonical: rankMath.canonicalUrl },
openGraph: { title: openGraph.ogTitle, description: openGraph.ogDescription },
twitter: { card: 'summary_large_image', title: twitter.twitterTitle, description: twitter.twitterDescription },
```

## Rank Math score hints (článok + kategórie)

1. Focus keyword v **SEO title** (blízko začiatku), **H1**, prvých ~10 % textu, **meta description**, slug.  
2. Meta description **140–160** znakov, prospech + brand, bez liečebných claimov.  
3. 1× H1; H2/H3/H4 max **3×** každá (vzorový článok).  
4. 2–4 interné linky na `/kategorie/*` a `/produkty`.  
5. YMYL disclaimer viditeľný.  
6. Schema Article/CollectionPage + OG/Twitter vyplnené.  
7. Keyword density prirodzená (žiadny stuffing).

## Zásady (povinné)

1. Doplnok stravy **nie je liek**.  
2. Žiadne liečebné / absolútne sľuby.  
3. Deti / tehotenstvo / pet / byliny = vyšší `ymylLevel`.  
4. Merge do freeze JSON **len novou verziou** + nový `FREEZE.json` hash.

## Next

1. Human medical/legal review.  
2. Import do Rank Math / CMS podľa mapping tabuľky.  
3. Publish článku + hreflang `sk/cs/en/de` podľa locale cookie modelu storefrontu.  
