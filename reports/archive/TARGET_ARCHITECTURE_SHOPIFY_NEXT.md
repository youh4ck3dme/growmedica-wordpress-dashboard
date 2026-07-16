# Target Architecture: Shopify (Commerce Engine) + Next.js (Headless Storefront)

This document describes the modern target architecture designed for **Grow Medical** to replace the legacy PHP application. The new system separates the presentation layer (frontend) from the commerce logic (backend), utilizing Shopify as the single source of truth and Next.js as the high-performance delivery channel.

---

## Architectural Overview

```mermaid
graph TD
    %% Presentation Layer
    Client[Browser / Client App] -->|HTTPS / Next.js Client| NextJS[Next.js App Router Frontend<br/>Hosted on Vercel]
    Client -->|Direct CDN Fetch| ShopifyCDN[Shopify CDN<br/>Images & Assets]
    Client -->|Client-side Cart & Checkout| ShopifyStorefrontAPI[Shopify Storefront API<br/>GraphQL]

    %% Next.js Server Components / SSR
    subgraph NextJS Server (Vercel Edge/Serverless)
        Middleware[Next.js Middleware<br/>Geo-routing, Security, CSP]
        AppRouter[Next.js Pages & Layouts<br/>Static/Dynamic Pages]
        APIRoutes[Next.js API Routes<br/>Proxying, Custom Integrations]
    end

    NextJS --> Middleware
    Middleware --> AppRouter
    AppRouter -->|GraphQL Queries / Cached Static Props| ShopifyStorefrontAPI
    APIRoutes -->|Secure GraphQL/REST Mutations| ShopifyAdminAPI[Shopify Admin API<br/>GraphQL/REST]

    %% Shopify Commerce Engine
    subgraph Shopify Commerce Core
        ShopifyStorefrontAPI
        ShopifyCDN
        ShopifyAdminAPI
        ShopifyDatabase[(Shopify Database<br/>Products, Orders, Customers)]
    end

    %% Webhooks & Background Sync
    ShopifyAdminAPI --> ShopifyDatabase
    ShopifyDatabase -->|Webhooks: Inventory Change, Order Created| APIRoutes
    SyncScripts[Legacy Sync Scripts / ERP] -->|Bulk Updates| ShopifyAdminAPI
```

---

## Core Technologies & Platform Decisions

### 1. Shopify Commerce Engine
Shopify is the central database and engine for all e-commerce operations. It acts as the single source of truth for:
*   **Catalog & Inventory**: All products, variants, descriptions, images, and stock levels.
*   **Checkout & Payments**: Standard Shopify Checkout (hosted or integrated via Shopify's secure checkout page) handling payment gateways, PCI compliance, and cart calculations.
*   **Orders & Customers**: Post-purchase lifecycle, invoicing, and customer accounts.

#### API Integrations:
*   **Storefront API (GraphQL)**: Used for high-speed read-only queries (fetching products, collections, search results) and client-side cart mutations. Because it is optimized for public client-side access, it is rate-limited per buyer IP rather than a strict global limit.
*   **Admin API (GraphQL/REST)**: Used strictly server-side for backend syncs, inventory adjustments, and order processing. Requires a private Access Token.

### 2. Next.js App Router (Frontend)
Next.js provides the UI framework, running on React Server Components (RSC) to maximize speed and SEO.
*   **Language**: TypeScript for static type-safety across product properties and API payloads.
*   **Styling**: Tailwind CSS for responsive, lightweight, utility-first designs.
*   **Rendering Strategies**:
    *   **Static Site Generation (SSG)**: Pre-rendered static pages for landing pages, blogs, and marketing pages.
    *   **Incremental Static Regeneration (ISR)**: For Product Details Pages (PDP) and Collection Listing Pages (PLP) to fetch updates every $N$ minutes without full rebuilds.
    *   **Server-Side Rendering (SSR)**: Used only for highly dynamic pages (e.g., search results, customer account portal).

### 3. Vercel Hosting & Global Edge Network
*   **Edge Middleware**: Used for georouting, internationalization, and enforcing security headers (like Content Security Policy).
*   **Edge Caching**: Fully utilizes Vercel's Edge Network to serve pre-rendered pages instantly to clients globally.

### 4. Shopify CDN
*   All product images and media are hosted directly on Shopify's global CDN (`cdn.shopify.com`).
*   Next.js utilizes `next/image` with the Shopify loader to automatically serve optimized, correctly sized WebP/AVIF images based on the client viewport.

### 5. Decoupled Middleware & Next.js API Routes
Any feature that Shopify cannot handle (such as custom product configurators, local Slovak legal registers, or custom ERP sync bridges) is handled through isolated **Next.js API Routes** acting as serverless endpoints. This keeps the core front-end clean and avoids the need for a separate custom backend server.
