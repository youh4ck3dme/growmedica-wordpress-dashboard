/** WooCommerce REST API v3 shapes used by the GrowMedica headless layer. */

export interface WooMoney {
  amount: string
  currencyCode: string
}

export interface WooImage {
  id: number
  src: string
  name: string
  alt: string
}

export interface WooCategory {
  id: number
  name: string
  slug: string
  description: string
  parent: number
  count: number
  image: WooImage | null
}

export interface WooProduct {
  id: number
  name: string
  slug: string
  permalink: string
  type: string
  status: string
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  stock_status: 'instock' | 'outofstock' | 'onbackorder' | string
  stock_quantity: number | null
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  images: WooImage[]
  attributes: Array<{
    id: number
    name: string
    slug: string
    options: string[]
  }>
  date_modified_gmt: string
}

export interface WooPaginated<T> {
  items: T[]
  total: number
  totalPages: number
  page: number
  perPage: number
}