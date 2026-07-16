# Risk Register & Security Model Specifications

This document identifies potential transition risks during the Grow Medical migration and details the security architectural standards applied to prevent threats.

---

## 1. Risk Register & Mitigation Matrix

| Risk Area | Likelihood | Impact | Description | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Non-Public Product Images** | Medium | High | Legacy images on local/private servers cannot be fetched by Shopify CDN during import. | Host legacy images on a temporary public HTTP server (e.g. AWS S3 public bucket or public staging site) before running the import. |
| **Invalid Handles** | Low | Medium | Broken, blank, or duplicate URL handles break PDP navigation and SEO redirects. | Pre-sanitize and validate slugs inside the conversion script. Implement check for duplicate handles prior to export. |
| **SKU Duplications** | Medium | High | Shopify requires unique SKUs per variant. Duplicates cause imports to fail or overwrite variants. | Run database validation queries to find duplicate SKU values. Append `-var1`, `-var2` to non-unique SKUs. |
| **Tax/Price Discrepancies** | Medium | High | Customer checkout displays different prices than catalog pages due to misconfigured DPH settings. | Enable "Show prices inclusive of tax" globally in Shopify settings. Test prices in sandbox environment. |
| **Broken Category Structure** | High | Medium | Legacy categories don't map cleanly to Shopify's tag-based collection system. | Map categories to tags (e.g. `kategoria:Caje`) and build Shopify Smart Collections dynamically based on tags. |
| **Legacy HTML & Script Injection** | High | Low | Product descriptions contain inline inline PHP/JS or absolute URLs pointing to old domains. | Sanitize HTML strings in import script, strip `script` tags, inline styles, and rewrite old media URLs. |
| **Loss of SEO Rankings** | High | Critical | Search engines crawl old URLs leading to 404 Page Not Found. | Set up extensive permanent 301 redirect mappings in Next.js `next.config.js` or Next.js middleware. |
| **Payment Gateway Gaps** | Medium | Critical | Payment options (e.g., Slovak-specific bank transfers or card processors) not supported natively by Shopify. | Configure supported checkout gateways (such as GP webpay, TrustPay, Stripe, or local bank transfer manual payouts). |

---

## 2. Security Model Specifications

To protect the headless store against vulnerabilities (SQLi, XSS, CSRF, and secret leaks present in the legacy system), the following security layout is enforced:

### A. Token Separation & Administrative Security
*   **Shopify Admin API Tokens**: **Never** expose these keys to the client-side browser. They must only exist as server-side environment variables (`SHOPIFY_ADMIN_API_ACCESS_TOKEN`) executed within Next.js Server Components, API routes, or backend sync scripts.
*   **Shopify Storefront API Tokens**: These are read-only public tokens (`SHOPIFY_STOREFRONT_ACCESS_TOKEN`) used to query the public catalog. They may safely be exposed on the frontend, as they are globally rate-limited by Shopify per buyer IP address.

### B. Environment Variable Validation
Next.js server startups will fail immediately if essential credentials are missing. We implement `zod` schema verification inside `src/lib/env.ts`:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_ADMIN_API_ACCESS_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url()
});

export const env = envSchema.parse({
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  SHOPIFY_ADMIN_API_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
});
```

### C. Rate Limiting for Custom API Routes
Any custom endpoints (like a dynamic contact form, reviews system, or search proxy) must implement rate limiting on Vercel to prevent denial of service (DoS) attacks:
*   Utilize `@upstash/ratelimit` (Redis-based edge rate limiter) or Next.js edge middleware caching to restrict client access to a maximum of 60 requests per minute per IP.

### D. Security Headers & CSP (Content Security Policy)
A strict HTTP security configuration is applied inside `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.shopify.com; connect-src 'self' https://*.shopify.com;"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
];
```

### E. Audit Logs for Sync Operations
*   Any background script executing writes or updates via the Shopify Admin API must output unified logging schemas.
*   Logs must track: Timestamp, Action (Create/Update/Delete), Object Type, Product ID/SKU, Status (Success/Failure), and Error Payload if applicable.
*   Logs are written to persistent cloud logging services (like Vercel Logs or Datadog) to prevent local file tampering.
