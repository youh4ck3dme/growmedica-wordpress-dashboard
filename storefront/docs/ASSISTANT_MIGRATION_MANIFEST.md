# Assistant chatbot — migration manifest

Source repo: `/Users/erikbabcan/growmedicanextjs` (not `26.5-growmedica-cursor`, which is empty).

Target: `storefront/` in `c1growmedical-full-web`.

## Copied / adapted into storefront

| Source (growmedicanextjs) | Target (storefront) | Status |
|---------------------------|---------------------|--------|
| `backend/assistant.py` → `PHARMACIST_PERSONA` | `src/lib/ai/prompts/pharmacist.ts` | Adapted (TS) |
| `backend/assistant.py` → compose logic | `src/lib/ai/assistantChat.ts` | Adapted (Next.js, no Python) |
| `src/lib/pharmacist-assistant.ts` | `src/lib/ai/pharmacist-assistant.ts` | Adapted (Shopify catalog) |
| `src/lib/pharmacist-assistant-events.ts` | `src/lib/ai/pharmacist-assistant-events.ts` | Copied |
| `src/app/api/assistant/chat/route.ts` | `src/app/api/assistant/chat/route.ts` | Rewritten (direct Mistral, no FastAPI proxy) |
| `src/components/global/PharmacistAssistantDrawer.tsx` | `src/components/ai/PharmacistAssistantDrawer.tsx` | Adapted (NOOR drawer, no order draft V1) |
| Footer / MobileAppDock chat triggers | `AssistantChatTrigger.tsx`, Footer, MobileNav | Adapted |
| `docs/mistr.md`, blueprint | `docs/ASSISTANT_CHAT.md` | Summarized |

## Already in storefront (not copied)

| Path | Purpose |
|------|---------|
| `src/lib/ai/client.ts` | JSON Mistral calls for widgets |
| `src/lib/ai/context.ts` | Shopify product context |
| `src/lib/ai/compliance.ts` | Blocked claims + `SAFE_DISCLAIMER` |
| `src/components/ai/SupplementFinder.tsx` | Homepage AI recommend |
| `src/components/ai/ProductFitBox.tsx` | PDP fit check |
| `src/app/api/ai/*` | recommend, product-fit, compliance-check |

## Not copied (out of scope for Shopify headless)

- `backend/main.py`, Postgres `assistant_memory`
- `supabase/functions/assistant-chat/`
- Order draft / `/api/orders` checkout form (use `/kosik` + Shopify checkout)
- `LLM_PROVIDER`, `BACKEND_URL`, OpenAI failover

## Env (shared with existing Mistral widgets)

- `MISTRAL_API_KEY`, `MISTRAL_API_KEY_BACKUP`, `MISTRAL_MODEL`, `MISTRAL_MOCK_MODE`
- `SHOPIFY_*` for product context
