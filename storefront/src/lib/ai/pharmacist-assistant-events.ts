export const PHARMACIST_ASSISTANT_OPEN_EVENT = 'growmedica:pharmacist-assistant:open'

let pendingOpen = false

export function consumePendingAssistantOpen(): boolean {
  if (!pendingOpen) return false
  pendingOpen = false
  return true
}

export function openPharmacistAssistant() {
  if (typeof globalThis.window === 'undefined') {
    return
  }

  pendingOpen = true
  globalThis.window.dispatchEvent(new Event(PHARMACIST_ASSISTANT_OPEN_EVENT))
}
