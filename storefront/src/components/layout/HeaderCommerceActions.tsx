'use client'

import Link from 'next/link'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { IconBasket, IconHeart, IconUser } from '@/components/icons/storefront'
import { useCommerceHeaderCounts } from '@/hooks/useCommerceHeaderCounts'
import { cn } from '@/lib/utils'

type HeaderCommerceActionsProps = {
  actionClassName?: string
}

export default function HeaderCommerceActions({
  actionClassName = 'glass-navbar__action relative',
}: HeaderCommerceActionsProps) {
  const { t } = useLocale()
  const { cartCount, wishlistCount } = useCommerceHeaderCounts()

  const profileAria = t('aria.profile')
  const wishlistAria =
    wishlistCount > 0
      ? `${t('aria.wishlist')}, ${t('aria.wishlistItems', { count: wishlistCount })}`
      : t('aria.wishlist')
  const cartAria =
    cartCount > 0
      ? `${t('aria.cart')}, ${t('aria.cartItems', { count: cartCount })}`
      : t('aria.cart')

  return (
    <>
      <Link href="/profil" id="profile-button" className={cn(actionClassName)} aria-label={profileAria}>
        <IconUser size={20} />
      </Link>

      <Link href="/oblubene" id="wishlist-button" className={cn(actionClassName)} aria-label={wishlistAria}>
        <IconHeart size={20} />
        {wishlistCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white bg-red-500"
            aria-hidden="true"
          >
            {wishlistCount > 9 ? '9+' : wishlistCount}
          </span>
        )}
      </Link>

      <Link href="/kosik" id="cart-button" className={cn(actionClassName)} aria-label={cartAria}>
        <IconBasket size={20} />
        {cartCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white bg-(--color-primary)"
            aria-hidden="true"
          >
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </Link>
    </>
  )
}
