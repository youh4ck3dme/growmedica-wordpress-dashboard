import { NextResponse } from 'next/server'
import { cmsGetCustomer, fetchCustomerOrders } from '@/lib/auth/cms-auth'
import { readCustomerSessionFromCookies } from '@/lib/auth/session'

export const runtime = 'nodejs'

function addressFromMeta(meta: Record<string, string> | undefined) {
  if (!meta) return null
  const street = [meta.address_1, meta.address_2].filter(Boolean).join(', ')
  if (!street && !meta.city && !meta.postcode) return null
  return {
    street: street || '—',
    city: meta.city || '',
    zip: meta.postcode || '',
    country: meta.country || '',
  }
}

export async function GET() {
  const session = await readCustomerSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const customerResult = await cmsGetCustomer(session.customerId)
  if (!customerResult.ok) {
    return NextResponse.json({ error: customerResult.message }, { status: customerResult.status })
  }

  const customer = customerResult.data
  const billing = addressFromMeta(customer.billing)
  const shipping = addressFromMeta(customer.shipping)
  const addresses = [billing, shipping].filter(Boolean)
  const orders = await fetchCustomerOrders(session.customerId)

  return NextResponse.json({
    customer: {
      customerId: customer.customerId,
      email: customer.email,
      name: customer.name,
      billing: customer.billing ?? {},
      shipping: customer.shipping ?? {},
      addresses,
    },
    orders,
  })
}
