# NEXTJS IMPLEMENTATION PLAN — Grow Medical Headless Storefront

## Cieľ
Vytvoriť produkčný Next.js 15 headless storefront pre Grow Medical napojený na Shopify Storefront API.

## Princípy
- **Shopify** = source of truth (produkty, varianty, ceny, sklad, košík, checkout)
- **Next.js** = presentation layer (UI, SEO, performance)
- **Legacy PHP** = mŕtvy migračný zdroj — žiadna runtime závislosť
- **Admin API** = nikdy v browseri
- **Checkout** = vždy Shopify native

---

## Tech Stack

| Vrstva        | Technológia                          |
|---------------|--------------------------------------|
| Framework     | Next.js 15 (App Router)              |
| Jazyk         | TypeScript (strict mode)             |
| Štýlovanie    | Tailwind CSS 4                       |
| API           | Shopify Storefront API GraphQL 2025-01 |
| Env validácia | Zod                                  |
| Linting       | ESLint + Prettier                    |
| Deployment    | Vercel                               |
| Images        | next/image + Shopify CDN             |

---

## Adresárová Štruktúra

```
storefront/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout, fonts, providers
│   │   ├── page.tsx                    # Homepage (ISR)
│   │   ├── produkty/
│   │   │   ├── page.tsx                # Product listing (ISR + filtering)
│   │   │   └── [handle]/
│   │   │       └── page.tsx            # Product detail (ISR + JSON-LD)
│   │   ├── kolekcie/
│   │   │   └── [handle]/
│   │   │       └── page.tsx            # Collection page (ISR)
│   │   ├── vyhladavanie/
│   │   │   └── page.tsx                # Search results
│   │   ├── kosik/
│   │   │   └── page.tsx                # Cart page
│   │   ├── checkout/
│   │   │   └── route.ts                # Checkout redirect route
│   │   ├── api/
│   │   │   └── revalidate/
│   │   │       └── route.ts            # Shopify webhook revalidation
│   │   ├── robots.ts                   # robots.txt generator
│   │   └── sitemap.ts                  # sitemap.xml generator
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── ProductInfo.tsx
│   │   │   ├── VariantSelector.tsx
│   │   │   └── AddToCartButton.tsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartLineItem.tsx
│   │   │   └── CartSummary.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Container.tsx
│   │       ├── Price.tsx
│   │       ├── Skeleton.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── shopify/
│   │   │   ├── client.ts               # GraphQL fetch client
│   │   │   ├── queries.ts              # All GraphQL queries
│   │   │   ├── mutations.ts            # Cart mutations
│   │   │   ├── types.ts                # TypeScript types
│   │   │   ├── cart.ts                 # Cart operations
│   │   │   ├── products.ts             # Product fetching
│   │   │   └── collections.ts          # Collection fetching
│   │   ├── env.ts                      # Zod env validation
│   │   ├── seo.ts                      # SEO helpers
│   │   └── utils.ts                    # Utilities
│   └── styles/
│       └── globals.css
├── public/
├── .env.example
├── .env.local                          # Reálne tokeny — gitignored
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Rendering Stratégia

| Route                   | Typ        | Revalidácia |
|-------------------------|------------|-------------|
| `/`                     | ISR        | 3600s       |
| `/produkty`             | ISR        | 3600s       |
| `/produkty/[handle]`    | ISR        | 3600s       |
| `/kolekcie/[handle]`    | ISR        | 3600s       |
| `/vyhladavanie`         | Dynamic    | –           |
| `/kosik`                | Client     | –           |
| `/checkout`             | Route Handler | –        |
| `sitemap.ts`            | Dynamic    | On-demand   |

---

## Fázy Implementácie

### Fáza 1 — MVP Storefront (TERAZ)
- [x] Next.js skeleton + projekt setup
- [ ] Shopify GraphQL client
- [ ] Homepage (hero, featured products, trust badges)
- [ ] Product listing (/produkty)
- [ ] Product detail (/produkty/[handle])
- [ ] Variant selector
- [ ] Cart (drawer + stránka)
- [ ] Checkout redirect → Shopify

### Fáza 2 — UX Polish
- [ ] Filtre (Type/Tags)
- [ ] Sorting produktov
- [ ] Kolekcie (/kolekcie/[handle])
- [ ] Search (/vyhladavanie)
- [ ] SEO landing sections
- [ ] Trust badges blok
- [ ] Structured data / JSON-LD
- [ ] Redirect mapping zo starých PHP URL

### Fáza 3 — PWA (NESKÔR)
- [ ] Web App Manifest
- [ ] Service Worker
- [ ] Offline fallback
- [ ] Install prompt
- [ ] Push notifications

---

## Kritické Pravidlá

> ⛔ Žiadny vlastný checkout  
> ⛔ Žiadna vlastná produktová DB  
> ⛔ Žiadny Admin API token v browseri  
> ⛔ Žiadna legacy PHP runtime závislosť  
> ⛔ PWA nie je MVP blocker  
