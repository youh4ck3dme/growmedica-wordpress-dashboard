'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeToast } from '@/components/ui/ThemeToast'

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
  const [isLiked, setIsLiked] = useState(false)
  const { toast } = useThemeToast()

  // Load initial wishlist state
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

    try {
      const stored = localStorage.getItem('gm_wishlist')
      let wishlist = stored ? (JSON.parse(stored) as string[]) : []

      let newLiked = false
      if (wishlist.includes(productHandle)) {
        wishlist = wishlist.filter((h) => h !== productHandle)
        toast({
          title: 'Odstránené z obľúbených',
          description: `Produkt ${productTitle} bol odstránený z vášho zoznamu prianí.`,
          variant: 'default',
        })
      } else {
        wishlist.push(productHandle)
        newLiked = true
        toast({
          title: 'Pridané do obľúbených',
          description: `Produkt ${productTitle} bol pridaný do vášho zoznamu prianí.`,
          variant: 'success',
        })
      }

      localStorage.setItem('gm_wishlist', JSON.stringify(wishlist))
      setIsLiked(newLiked)

      // Dispatch custom event to notify header/other components
      window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: wishlist }))
    } catch {
      // Ignore errors
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleWishlist}
        aria-label={isLiked ? 'Odstrániť z obľúbených' : 'Pridať do obľúbených'}
        className={cn(
          "p-2 rounded-full border border-(--color-border) bg-white/80 hover:bg-white text-gray-500 hover:text-(--color-error) shadow-sm hover:scale-105 transition-all flex items-center justify-center",
          isLiked && "text-(--color-error) border-red-200 bg-red-50/50 hover:bg-red-50",
          className
        )}
      >
        <Heart className={cn("h-4.5 w-4.5 transition-transform duration-200", isLiked && "fill-current scale-110")} />
      </button>
    )
  }

  return (
    <button
      onClick={toggleWishlist}
      className={cn(
        "btn btn-secondary flex items-center justify-center gap-2 py-2.5",
        isLiked && "text-(--color-error) border-red-200 hover:bg-red-50/50",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isLiked && "fill-current text-(--color-error)")} />
      <span>{isLiked ? 'V obľúbených' : 'Pridať do obľúbených'}</span>
    </button>
  )
}
