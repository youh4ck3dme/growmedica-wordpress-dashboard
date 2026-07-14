# NOOR Components Inventory

Generated for branch `cursor/magickkomponentsforgrowmedika-c482`.

## Source status

| Asset | Status | Notes |
|-------|--------|-------|
| `komponents.zip` (Magic Patterns) | Not in repo | Built from blueprint + existing NOOR tokens in `globals.css` |
| `docs/products_export_shopify.zip` | Gitignored product export | Shopify CSV — not UI components; used by category fixture scripts |

## New NOOR component library

| Component | Path | Replaces |
|-----------|------|----------|
| Toast + ToastProvider | `src/components/noor/ui/Toast.tsx` | Inline success text in AddToCart; cookie/PWA feedback |
| SearchDrawer | `src/components/noor/ui/SearchDrawer.tsx` | Mobile search `Link` → `/vyhladavanie` (NOOR only) |
| Accordion | `src/components/noor/ui/Accordion.tsx` | FAQ static cards; ProductTabs on mobile (NOOR) |
| Input | `src/components/noor/ui/Input.tsx` | Raw `<input>` in forms (NOOR skin) |
| Textarea | `src/components/noor/ui/Textarea.tsx` | SupplementFinder textarea (NOOR) |
| Select | `src/components/noor/ui/Select.tsx` | Native select styling (NOOR) |
| Checkbox | `src/components/noor/ui/Checkbox.tsx` | Form checkboxes (NOOR) |
| NoorUiProviders | `src/components/noor/providers/NoorUiProviders.tsx` | Toast viewport + SearchDrawer portal |

## Theme-aware wrappers (Classic fallback)

| Wrapper | Path | NOOR | Classic |
|---------|------|------|---------|
| ThemeSearch | `src/components/ui/ThemeSearch.tsx` | SearchDrawer trigger | Link to `/vyhladavanie` |
| ThemeAccordion | `src/components/ui/ThemeAccordion.tsx` | NOOR Accordion | Stacked cards |
| ThemeInput | `src/components/ui/ThemeInput.tsx` | NOOR Input | Standard input classes |
| ThemeTextarea | `src/components/ui/ThemeTextarea.tsx` | NOOR Textarea | Standard textarea |
| useThemeToast | `src/components/ui/ThemeToast.tsx` | `useToast()` | `window.alert` fallback noop toast |

## CSS tokens added

- `--noor-toast-bg`, `--noor-toast-text`, `--noor-drawer-bg`, `--noor-accordion-border`, `--noor-input-bg`

## Pages touched

- `layout.tsx` — NoorUiProviders
- `Header.tsx`, `MobileNav.tsx` — ThemeSearch
- `page.tsx` — homepage search pill
- `CookieBanner.tsx`, `AddToCartButton.tsx` — toast
- `SupplementFinder.tsx` — ThemeTextarea
- `faq/page.tsx` — ThemeAccordion via FaqAccordionList
- `ProductTabs.tsx` — NOOR accordion on mobile
