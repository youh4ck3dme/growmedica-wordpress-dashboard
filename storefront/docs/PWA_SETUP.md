# PWA Setup Guide — GrowMedica.sk

## Overview

GrowMedica uses **Serwist** (`@serwist/next`) for offline-first PWA with:
- Service worker caching (network-first for HTML, cache-first for assets)
- Offline fallback (`/offline` route + `/offline.html`)
- Install banner (`beforeinstallprompt` event handler)
- Web app manifest with PWA metadata & icons
- API timeout fallback (5s NetworkOnly strategy)

## Key Files

| File | Purpose |
|------|---------|
| `src/app/sw.ts` | Service worker code (Serwist runtime config) |
| `public/manifest.webmanifest` | PWA metadata + icons (id, scope, theme_color, categories) |
| `src/app/offline/page.tsx` | React offline fallback route (`/offline`) |
| `public/offline.html` | Static HTML offline fallback (edge case) |
| `src/components/layout/PwaInstallBanner.tsx` | Install prompt UI (beforeinstallprompt handler) |
| `next.config.ts` | Serwist integration via `withSerwist()` wrapper |

## Caching Strategy

| Content Type | Strategy | Details |
|--------------|----------|---------|
| **HTML (routes)** | Network-first | Fetch from network (5s timeout); fallback to cache; nav fallback → `/offline` |
| **CSS/JS/fonts** | Cache-first | Serve from cache; if missing, fetch network |
| **API calls** | NetworkOnly + 5s timeout | Try network; timeout after 5s; fallback to cache or error response |
| **Images** | Cache-first | Serve from cache; if missing, fetch network |

## Development

### Local Development (SW Disabled)
```bash
# Service worker is disabled in development mode
yarn dev

# Open http://localhost:5555
# DevTools → Application → Service Workers: (empty — expected)
```

### Test Production SW Locally
```bash
# Build production bundle with SW
yarn build

# Start production server
yarn start

# Open http://localhost:3000
# DevTools → Application → Service Workers: `sw.js` should be ACTIVE
```

### Run PWA Tests
```bash
# Tests: manifest validation, offline route, sw.js presence
yarn test:pwa

# Expected: 7/7 tests pass
```

## Testing PWA Features

### 1. Service Worker Active
- Open DevTools → **Application** tab
- Go to **Service Workers**
- Verify: `sw.js` shows status "activated and running" ✓

### 2. Offline Support
- DevTools → **Network** tab
- Throttle: **Offline** (checkbox at top)
- Reload page
- Expected: Serve `/offline` page or cached content

### 3. Cache Inspection
- DevTools → **Application** → **Cache Storage**
- Expand: `growmedica-v1` cache
- Should see: HTML, CSS, JS, images, fonts

### 4. Install Banner
- **Desktop Chrome**: Homepage → banner appears (usually bottom-right)
- **Android Chrome**: Homepage → banner appears (bottom sheet)
- **iOS Safari**: Not supported (PWA install via home screen only)
- Click **"Inštalovať"** → Browser install prompt

### 5. Lighthouse PWA Audit
```bash
npx lighthouse https://growmedicanextjs.vercel.app/ --only-categories=pwa --view
```

Expected scores:
- PWA: ≥ 90
- Installable: ✓ Yes
- Offline support: ✓ Yes
- Service worker: ✓ Yes

## Production Deployment

### Vercel Auto-Deploy
- Push to `main` branch
- Vercel detects changes
- `withSerwist()` plugin builds `public/sw.js`
- Vercel serves `sw.js` + precached assets

### Verification Post-Deploy
```bash
# Check endpoints
curl -I https://growmedicanextjs.vercel.app/sw.js
# Expected: 200 OK, Content-Type: application/javascript

curl -I https://growmedicanextjs.vercel.app/manifest.webmanifest
# Expected: 200 OK, Content-Type: application/manifest+json

curl -I https://growmedicanextjs.vercel.app/offline
# Expected: 200 OK, Content-Type: text/html
```

## Manifest Configuration

**File**: `public/manifest.webmanifest`

```json
{
  "id": "/",
  "name": "GrowMedica.sk",
  "short_name": "GrowMedica",
  "description": "Premium zdravotné produkty",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#35C79A",
  "background_color": "#FFFFFF",
  "icons": [
    { "src": "/logo-icon.svg", "sizes": "any", "type": "image/svg+xml" },
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["shopping", "health"]
}
```

**Fields**:
- `id` — Unique identifier for the app manifest (required for PWA)
- `scope` — Navigation scope (users can't navigate outside this path)
- `display: standalone` — App opens without browser UI
- `theme_color` — Browser chrome color (address bar, tabs)
- `icons` — App icons (both `any` and `maskable` purpose)
- `categories` — App categorization in app stores

## Install Banner (`PwaInstallBanner`)

**Component**: `src/components/layout/PwaInstallBanner.tsx`

- Listens for `beforeinstallprompt` event (Chrome, Edge, Android)
- Shows banner: "Inštalujte GrowMedica.sk"
- User can click "Inštalovať" to add app to home screen
- Banner dismissed after interaction (stored in localStorage)
- Safari iOS: No prompt (users install via "Share" → "Add to Home Screen")

## Offline Fallback

### `/offline` Route
- React route that serves offline page
- Shows: 📡 icon, "Bez pripojenia" message, "Obnoviť stránku" button

### `/offline.html` Static Fallback
- Static HTML served by SW if React route fails
- Used for edge cases or very old browsers

## Troubleshooting

### "SW not registering"
```bash
# Check DevTools → Application → Service Workers
# If empty:
# 1. Build production (yarn build)
# 2. Clear cache (DevTools → Application → Clear)
# 3. Restart server (yarn start)
```

### "Manifest not found"
```bash
curl https://growmedicanextjs.vercel.app/manifest.webmanifest
# If 404: Check next.config.ts additionalPrecacheEntries
```

### "Offline page not loading"
```bash
# Check sw.ts fallback configuration
# Verify /offline.html exists in public/
# Test: DevTools → Network → Offline → Reload
```

### "@import warning in CSS"
```bash
# Fixed in commit ddc27f1
# Fonts now loaded via next/font (layout.tsx)
# No CSS @import needed
```

## Future Enhancements

1. **Push Notifications** — Firebase Cloud Messaging
2. **Update Prompt** — "New version available" banner
3. **Background Sync** — Queue cart items when offline
4. **iOS PWA** — Full PWA support on Safari (iOS 17+)
5. **Analytics** — Track installs, active users

## Resources

- [Serwist Documentation](https://serwist.pages.dev/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest Spec](https://w3c.github.io/manifest/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
