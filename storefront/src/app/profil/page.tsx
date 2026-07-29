'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { User, LogOut, MapPin, Receipt, Package } from 'lucide-react'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { useT } from '@/components/i18n/LocaleProvider'

type Address = {
  street: string
  city: string
  zip: string
  country: string
}

type CustomerOrder = {
  id: number
  number: string
  status: string
  total: string
  currency: string
  dateCreated: string
}

type ProfileCustomer = {
  customerId: number
  email: string
  name: string
  addresses: Address[]
}

export default function ProfilePage() {
  const t = useT()
  const [customer, setCustomer] = useState<ProfileCustomer | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useThemeToast()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (response.status === 401) {
          router.push('/prihlasenie')
          return
        }
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        const data = (await response.json()) as {
          customer: ProfileCustomer
          orders: CustomerOrder[]
        }
        if (cancelled) return
        setCustomer(data.customer)
        setOrders(data.orders ?? [])
      } catch {
        if (!cancelled) router.push('/prihlasenie')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast({
      title: t('auth.logoutTitle'),
      description: t('auth.logoutDesc'),
      variant: 'default',
    })
    window.dispatchEvent(new Event('auth-updated'))
    router.push('/prihlasenie')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-(--color-text-muted)">
        {t('auth.loading')}...
      </div>
    )
  }

  if (!customer) return null

  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="py-8 lg:py-12 bg-gray-50/50 min-h-screen">
      <Container>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-(--color-primary) text-white flex items-center justify-center font-bold text-lg">
              {initials || <User className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-(--color-text)">{customer.name}</h1>
              <p className="text-xs text-(--color-text-muted)">{customer.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-bold transition-all w-fit cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {t('auth.logout')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-(--color-border) rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-(--color-text) flex items-center gap-2 border-b border-(--color-border) pb-2">
                <MapPin className="h-4 w-4 text-(--color-text-light)" />
                {t('profile.address')}
              </h3>
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-(--color-text-muted)">{t('profile.noAddress')}</p>
              ) : (
                customer.addresses.map((addr, idx) => (
                  <div key={`${addr.street}-${idx}`} className="text-sm text-(--color-text-muted) leading-relaxed">
                    <p className="font-semibold text-(--color-text)">
                      {idx === 0 ? t('profile.billingAddress') : t('profile.shippingAddress')}
                    </p>
                    <p>{addr.street}</p>
                    <p>
                      {addr.zip} {addr.city}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white border border-(--color-border) rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-(--color-text)">{t('profile.loyalty')}</h3>
              <p className="text-xs text-(--color-text-muted) leading-relaxed">{t('profile.loyaltyComingSoon')}</p>
              <Link href="/produkty" className="btn btn-secondary w-full text-center text-sm font-semibold py-2 rounded-lg inline-block">
                {t('profile.continueShopping')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-(--color-text) flex items-center gap-2 border-b border-(--color-border) pb-3">
                <Package className="h-5 w-5 text-(--color-primary)" />
                {t('profile.orders')}
              </h3>

              {orders.length === 0 ? (
                <p className="text-sm text-(--color-text-muted) py-6 text-center">{t('profile.noOrders')}</p>
              ) : (
                <ul className="space-y-3">
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-2 border border-(--color-border) rounded-xl px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-(--color-text-light)" />
                        <div>
                          <p className="font-semibold text-(--color-text)">
                            {t('profile.orderNumber', { n: order.number })}
                          </p>
                          <p className="text-xs text-(--color-text-muted)">
                            {order.dateCreated
                              ? new Date(order.dateCreated).toLocaleDateString()
                              : '—'}{' '}
                            · {order.status}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-(--color-text)">
                        {order.total} {order.currency}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-[11px] text-(--color-text-light) pt-2">{t('profile.ordersCmsHint')}</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
