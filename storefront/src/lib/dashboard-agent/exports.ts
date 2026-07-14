type ExportRecord = {
  filename: string
  content: string
  createdAt: number
}

type ExportGlobal = typeof globalThis & {
  __growmedicaDashboardExports?: Map<string, ExportRecord>
}

const TTL_MS = 60 * 60 * 1000

function getExportStore(): Map<string, ExportRecord> {
  const g = globalThis as ExportGlobal
  if (!g.__growmedicaDashboardExports) g.__growmedicaDashboardExports = new Map()
  return g.__growmedicaDashboardExports
}

function prune() {
  const exports = getExportStore()
  const now = Date.now()
  for (const [id, record] of exports) {
    if (now - record.createdAt > TTL_MS) exports.delete(id)
  }
}

export function storeExport(content: string, filename: string): string {
  prune()
  const exports = getExportStore()
  const id = `export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  exports.set(id, { content, filename, createdAt: Date.now() })
  return id
}

export function getExport(id: string): ExportRecord | null {
  prune()
  return getExportStore().get(id) ?? null
}
