'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconHeart } from '@/components/icons/storefront'
import { cn } from '@/lib/utils'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { useT } from '@/components/i18n/LocaleProvider'
import { isLoggedIn } from '@/lib/auth/client-session'

interface WishlistButtonProps {
  productHandle: string
  productTitle?: string
  variant?: 'icon' | 'full'
  className?: string
}

export function WishlistButton({
  productHandle,
  productTitle = 'Produkt',
  variant = 'icon',
  className,
}: WishlistButtonProps) {
  const t = useT()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)
  const { toast } = useThemeToast()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gm_wishlist')
      const wishlist = stored ? (JSON.parse(stored) as string[]) : []
      setIsLiked(wishlist.includes(productHandle))
    } catch {
      // Ignore localStorage errors
    }
  }, [productHandle])

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn()) {
      toast({
        title: t('wishlist.loginRequiredTitle'),
        description: t('wishlist.loginRequiredDescription'),
        variant: 'default',
        action: {
          label: t('wishlist.loginAction'),
          onClick: () => router.push('/prihlasenie'),
        },
      })
      return
    }

    try {
      const stored = localStorage.getItem('gm_wishlist')
      let wishlist = stored ? (JSON.parse(stored) as string[]) : []

      let newLiked = false
      if (wishlist.includes(productHandle)) {
        wishlist = wishlist.filter((h) => h !== productHandle)
        toast({
          title: t('wishlist.removedTitle'),
          description: t('wishlist.removedDescription', { title: productTitle }),
          variant: 'default',
        })
      } else {
        wishlist.push(productHandle)
        newLiked = true
        toast({
          title: t('wishlist.addedTitle'),
          description: t('wishlist.addedDescription', { title: productTitle }),
          variant: 'success',
        })
      }

      localStorage.setItem('gm_wishlist', JSON.stringify(wishlist))
      setIsLiked(newLiked)

      window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: wishlist }))
    } catch {
      // Ignore errors
    }
  }

  if (variant === 'icon') {
    return (
      <button
        id="wishlist-btn"
        onClick={toggleWishlist}
        aria-label={isLiked ? t('wishlist.remove') : t('wishlist.add')}
        className={cn(
          "p-2 rounded-full border border-(--color-border) bg-white/80 hover:bg-white text-gray-500 hover:text-(--color-error) shadow-sm hover:scale-105 transition-all flex items-center justify-center",
          isLiked && "text-(--color-error) border-red-200 bg-red-50/50 hover:bg-red-50",
          className
        )}
      >
        <IconHeart
          size={18}
          filled={isLiked}
          className={cn('transition-transform duration-200', isLiked && 'scale-110')}
        />
      </button>
    )
  }

  return (
    <button
      id="wishlist-btn"
      onClick={toggleWishlist}
      aria-label={isLiked ? t('wishlist.remove') : t('wishlist.add')}
      className={cn(
        "btn btn-secondary flex w-full min-w-0 items-center justify-center gap-2 py-2.5 whitespace-normal text-center leading-tight sm:w-auto sm:whitespace-nowrap",
        isLiked && "text-(--color-error) border-red-200 hover:bg-red-50/50",
        className
      )}
    >
      <IconHeart size={16} filled={isLiked} className={cn(isLiked && 'text-(--color-error)')} />
      <span className="min-w-0 wrap-break-word">{isLiked ? t('wishlist.inList') : t('wishlist.add')}</span>
    </button>
  )
}
