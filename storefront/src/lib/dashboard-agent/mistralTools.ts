import type { AgentToolName } from './types'

const TOOL_PARAMETERS: Record<AgentToolName, Record<string, unknown>> = {
  list_products: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max products to return' },
      search: { type: 'string', description: 'Search query' },
    },
  },
  get_product: {
    type: 'object',
    properties: {
      handle: { type: 'string', description: 'Product handle/slug' },
    },
    required: ['handle'],
  },
  list_collections: {
    type: 'object',
    properties: {
      limit: { type: 'number' },
    },
  },
  get_collection_products: {
    type: 'object',
    properties: {
      handle: { type: 'string' },
    },
    required: ['handle'],
  },
  catalog_summary: { type: 'object', properties: {} },
  optimize_product_copy: {
    type: 'object',
    properties: {
      handle: { type: 'string' },
    },
    required: ['handle'],
  },
  generate_product_seo: {
    type: 'object',
    properties: {
      handle: { type: 'string' },
    },
    required: ['handle'],
  },
  bulk_update_prices: {
    type: 'object',
    properties: {
      percent_change: { type: 'number' },
      confirm: { type: 'boolean' },
    },
  },
  export_catalog_csv: { type: 'object', properties: {} },
  get_integration_status: { type: 'object', properties: {} },
  apply_product_copy: {
    type: 'object',
    properties: {
      handle: { type: 'string' },
      title: { type: 'string' },
      short_description: { type: 'string' },
      confirm: { type: 'boolean' },
    },
    required: ['handle', 'title', 'short_description'],
  },
  apply_product_seo: {
    type: 'object',
    properties: {
      handle: { type: 'string' },
      meta_title: { type: 'string' },
      meta_description: { type: 'string' },
      confirm: { type: 'boolean' },
    },
    required: ['handle', 'meta_title', 'meta_description'],
  },
  update_inventory: {
    type: 'object',
    properties: {
      handle: { type: 'string' },
      quantity: { type: 'number' },
      confirm: { type: 'boolean' },
    },
    required: ['handle', 'quantity'],
  },
  list_orders: {
    type: 'object',
    properties: {
      limit: { type: 'number' },
    },
  },
  get_order: {
    type: 'object',
    properties: {
      order_id: { type: 'string' },
    },
    required: ['order_id'],
  },
}

const TOOL_DEFINITIONS: Array<{ name: AgentToolName; description: string }> = [
  { name: 'list_products', description: 'List catalog products with optional search and limit' },
  { name: 'get_product', description: 'Get a single product by slug/handle' },
  { name: 'list_collections', description: 'List catalog categories/collections' },
  { name: 'get_collection_products', description: 'List products in a category by handle' },
  { name: 'catalog_summary', description: 'Aggregated catalog stats (counts, price range)' },
  { name: 'optimize_product_copy', description: 'Suggest improved product title and short description' },
  { name: 'generate_product_seo', description: 'Generate meta title and description for SEO' },
  { name: 'bulk_update_prices', description: 'Bulk update prices (dry-run unless confirm=true)' },
  { name: 'export_catalog_csv', description: 'Export catalog to CSV download' },
  { name: 'get_integration_status', description: 'CMS and Mistral integration health' },
  { name: 'apply_product_copy', description: 'Apply optimized title and description to a product (confirm=true)' },
  { name: 'apply_product_seo', description: 'Apply SEO meta title and description to a product (confirm=true)' },
  { name: 'update_inventory', description: 'Update inventory quantity for a product (confirm=true)' },
  { name: 'list_orders', description: 'List recent Shopify orders' },
  { name: 'get_order', description: 'Get order detail by ID or order number' },
]

export const MISTRAL_TOOL_SCHEMAS = TOOL_DEFINITIONS.map((tool) => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: TOOL_PARAMETERS[tool.name] ?? { type: 'object', properties: {} },
  },
}))
