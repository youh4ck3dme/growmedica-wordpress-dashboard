# UI/UX DESIGN SYSTEM — Grow Medical

## Filozofia

**Premium clean medical commerce.**  
Nie fitness. Nie neon. Nie bodybuilding vizuál.  
Apple-level clean layout. Dôvera. Profesionalita. Čistota.

---

## Farebná Paleta

```css
/* === DESIGN TOKENS === */
:root {
  /* Backgrounds */
  --color-bg:         #F7FAF9;   /* Stránkový podklad — veľmi jemná zelená */
  --color-surface:    #FFFFFF;   /* Karty, modaly, panely */
  --color-surface-2:  #F0F4F3;   /* Sekundárny povrch */

  /* Brand — Primary */
  --color-primary:       #0F766E;  /* Teal-700 — hlavná akčná farba */
  --color-primary-dark:  #115E59;  /* Teal-800 — hover stav */
  --color-primary-light: #CCFBF1;  /* Teal-100 — badge pozadie */

  /* Accent */
  --color-accent:     #38BDF8;   /* Sky-400 — sekundárne akcenty */

  /* Text */
  --color-text:       #0F172A;   /* Slate-900 — primárny text */
  --color-text-muted: #64748B;   /* Slate-500 — sekundárny text */
  --color-text-light: #94A3B8;   /* Slate-400 — placeholder, disabled */

  /* Borders */
  --color-border:     #E2E8F0;   /* Slate-200 */
  --color-border-focus: #0F766E;

  /* Status */
  --color-success:    #16A34A;   /* Green-600 */
  --color-warning:    #F59E0B;   /* Amber-500 */
  --color-error:      #DC2626;   /* Red-600 */

  /* Shadows */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-hover: 0 4px 12px rgba(15,118,110,0.12), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.15);
}
```

### Tailwind Konfigurácia

```ts
// tailwind.config.ts
colors: {
  brand: {
    50:  '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',  // Primary
    800: '#115E59',  // Primary Dark
    900: '#134E4A',
  }
}
```

---

## Typografia

```css
/* Primárny font: Geist Sans (Next.js natívny) alebo Inter */
--font-sans: 'Geist', 'Inter', -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace;

/* Typografická škála */
--text-xs:   0.75rem;   /* 12px — badges, labels */
--text-sm:   0.875rem;  /* 14px — sekundárny text */
--text-base: 1rem;      /* 16px — body text */
--text-lg:   1.125rem;  /* 18px — veľké body */
--text-xl:   1.25rem;   /* 20px — card titles */
--text-2xl:  1.5rem;    /* 24px — section headings */
--text-3xl:  1.875rem;  /* 30px — page headings */
--text-4xl:  2.25rem;   /* 36px — hero heading mobile */
--text-5xl:  3rem;      /* 48px — hero heading desktop */

/* Font weights */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;

/* Line heights */
--leading-tight:  1.25;
--leading-snug:   1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## Spacing System (8px grid)

```
2px  — micro dividers
4px  — tight padding
8px  — small gap
12px — inner component padding
16px — card padding
24px — section internal spacing
32px — section gap
48px — large section gap
64px — section padding vertical
96px — hero padding
```

---

## Komponentový Dizajn

### Product Card
```
┌─────────────────────────────┐
│  [Obrázok 4:3 ratio]        │
│  [BADGE: Skladom / Vypredané│
├─────────────────────────────┤
│  Značka (text-xs muted)     │
│  Názov produktu (text-lg)   │
│  Príchuť / Balenie (text-sm)│
│                             │
│  ~~pôvodná cena~~   CENA    │
│  [CTA tlačidlo]             │
└─────────────────────────────┘
```

**Hover efekt:** Jemný shadow upgrade + border-color → primary  
**Disabled:** Opacity 0.5 pri nedostupných variantoch

### Button Variants

```tsx
// Primary
<Button variant="primary">Pridať do košíka</Button>
// → bg-brand-700, text-white, hover:bg-brand-800

// Secondary  
<Button variant="secondary">Zobraziť detail</Button>
// → border border-brand-700, text-brand-700, hover:bg-brand-50

// Ghost
<Button variant="ghost">Zrušiť</Button>
// → text-muted, hover:bg-surface-2
```

### Badge Variants

```
[Skladom]    → bg-green-100, text-green-800
[Vypredané]  → bg-red-100, text-red-700
[Novinka]    → bg-brand-100, text-brand-800
[-30%]       → bg-amber-100, text-amber-800
```

### Header UX
```
Desktop:
[LOGO]  [Produkty] [Kolekcie] [O nás]  [🔍 Hľadaj]  [🛒 Košík (3)]

Mobile:
[≡ Menu]  [LOGO]  [🛒 Košík]
```
- Sticky header s blur backdrop
- Cart icon zobrazuje počet položiek
- Mobile: slide-in sheet zľava

### Cart Drawer
- Slide-in z pravej strany (off-canvas)
- Overlay s blur pozadím
- LineItems: obrázok + názov + variant + množstvo stepper + cena
- Footer: Medzisúčet + [Prejsť k pokladni] CTA
- Empty state: ikona + text + [Pokračovať v nákupe]

### Product Detail UX
```
Desktop (2-col):
[Obrázková galéria]  |  [Produktové info]
                         Breadcrumb
                         Značka
                         Názov (H1)
                         Hodnotenia (future)
                         Cena + compare-at
                         
                         Variant selector:
                         Príchuť: [Čoko] [Vanilka] [Jahoda]
                         Balenie: [500g] [1000g] [2000g]
                         
                         Stock badge
                         [Pridať do košíka]
                         
                         Benefit bullets
                         Popis (HTML)
```

---

## Loading Skeletons

```
Product Card Skeleton:
┌─────────────────────────────┐
│  [████████ shimmer ████████]│  ← aspect-[4/3]
├─────────────────────────────┤
│  [████ ██]                  │  ← brand + name
│  [████████████]             │
│  [████]          [███████]  │  ← price
│  [████████████████████████] │  ← button
└─────────────────────────────┘
```

Shimmer animácia: `bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse`

---

## Empty States

- **Žiadne produkty:** Ikona search + "Nenašli sme žiadne produkty" + reset filtrov
- **Prázdny košík:** Ikona shopping bag + "Váš košík je prázdny" + CTA do produktov
- **Chyba:** Ikona alert + "Nastala chyba" + retry button

---

## Animácie a Micro-interactions

```css
/* Globálne transition */
--transition-fast:   150ms ease;
--transition-base:   250ms ease;
--transition-slow:   350ms ease-in-out;

/* Hover lift efekt na kartách */
.product-card:hover {
  transform: translateY(-2px);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

/* Cart drawer slide-in */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
```

---

## Responzívne Breakpointy

| Breakpoint | px    | Použitie                    |
|------------|-------|-----------------------------|
| `sm`       | 640px | Mobil landscape             |
| `md`       | 768px | Tablet                      |
| `lg`       | 1024px| Desktop                     |
| `xl`       | 1280px| Wide desktop                |
| `2xl`      | 1536px| Ultra-wide (max container)  |

**Product Grid:**
- Mobile: 2 stĺpce
- Tablet: 2-3 stĺpce
- Desktop: 3-4 stĺpce

**Container max-width:** `1280px` s `px-4 sm:px-6 lg:px-8`
