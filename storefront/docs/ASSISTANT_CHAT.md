# Virtuálny lekárnik — assistant chat

Headless GrowMedica storefront uses **Mistral** via Next.js route `POST /api/assistant/chat` (no Python backend).

## UI

- Drawer: `PharmacistAssistantDrawer` (global, mounted in `DeferredLayoutBanners`)
- Open: Footer contact button, mobile nav link, `openPharmacistAssistant()` event
- Related widgets: `SupplementFinder` (homepage), `ProductFitBox` (PDP) — same `SAFE_DISCLAIMER`

## Env

Same as other AI features — see `.env.example` (`MISTRAL_API_KEY`, `MISTRAL_MOCK_MODE` for tests).

## Safety

- Input filtered by `checkCompliance()` before LLM call
- System persona: no diagnosis, no drug withdrawal advice; handoff on acute symptoms
- Order flow: direct users to `/kosik` and `/kontakt` (no in-chat checkout in V1)

## Tests

```bash
cd storefront && yarn playwright test tests/integrity/assistant.spec.ts --project=integrity
```
