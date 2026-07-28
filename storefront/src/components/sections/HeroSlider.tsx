'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useT } from '@/components/i18n/LocaleProvider'
import {
  HERO_IMAGE_SIZES,
  HERO_LCP_QUALITY,
  HERO_SLIDE_QUALITY,
} from '@/lib/hero-image'
import type { HeroCopyKey } from '@/lib/hero-slides'
import { cn } from '@/lib/utils'

export interface HeroSlide {
  id: string
  imageUrl: string
  alt: string
  width: number
  height: number
  copyKey: HeroCopyKey
  ctaHref: string
}

interface HeroSliderProps {
  slides: HeroSlide[]
}

const AUTOPLAY_MS = 6000

/**
 * useReducedMotion() is null on SSR and can be true on the client → hydration mismatch
 * if used for motion initial. Keep SSR + first client paint identical.
 */
function useHydrationSafeReducedMotion() {
  const prefersReduced = useReducedMotion()
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(prefersReduced === true)
  }, [prefersReduced])

  return reduceMotion
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const t = useT()
  const items = slides
  const [index, setIndex] = useState(0)
  const reduceMotion = useHydrationSafeReducedMotion()

  const goTo = useCallback(
    (next: number) => {
      if (items.length === 0) return
      setIndex((next + items.length) % items.length)
    },
    [items.length],
  )

  const goNext = useCallback(() => goTo(index + 1), [goTo, index])
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return

    const timer = window.setInterval(goNext, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [goNext, items.length, reduceMotion])

  if (items.length === 0) return null

  const active = items[index]
  const isLcpSlide = index === 0
  const showSlideControls = items.length > 1
  const key = active.copyKey
  const eyebrow = t(`hero.slides.${key}.eyebrow`)
  const title = t(`hero.slides.${key}.title`)
  const subtitle = t(`hero.slides.${key}.subtitle`)
  const cta = t(`hero.slides.${key}.cta`)

  return (
    <section
      className="theme-transition noor-reveal noor-hero-section hero-slider relative overflow-hidden bg-(--color-surface)"
      aria-labelledby="hero-heading"
    >
      <div className="hero-slider__stage relative w-full min-h-112 sm:min-h-128 lg:min-h-144">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active.id}
            className="absolute inset-0"
            initial={reduceMotion || isLcpSlide ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={active.imageUrl}
              alt={active.alt}
              fill
              priority={isLcpSlide}
              fetchPriority={isLcpSlide ? 'high' : 'auto'}
              loading={isLcpSlide ? 'eager' : 'lazy'}
              sizes={HERO_IMAGE_SIZES}
              className="object-cover object-center"
              quality={isLcpSlide ? HERO_LCP_QUALITY : HERO_SLIDE_QUALITY}
            />
            <div className="hero-slider__overlay absolute inset-0" aria-hidden="true" />
          </m.div>
        </AnimatePresence>

        <Container className="relative z-10 flex h-full min-h-[inherit] items-center justify-start py-8 sm:py-10 lg:py-14">
          <m.div
            key={`copy-${active.id}`}
            className="hero-slider__copy"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45 }}
          >
            <p className="section-label hero-slider__eyebrow">{eyebrow}</p>
            <h1
              id="hero-heading"
              className="noor-display-heading hero-slider__title font-extrabold leading-tight text-balance"
            >
              {title}
            </h1>
            <p className="hero-slider__subtitle leading-relaxed">
              {subtitle}
            </p>
            <Link
              href={active.ctaHref}
              id="hero-cta-primary"
              className="btn btn-primary hero-slider__cta noor-pill-cta w-auto"
            >
              {cta}
            </Link>
          </m.div>
        </Container>

        {showSlideControls && (
          <>
            <div className="hero-slider__controls absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2">
              {items.map((slide, dotIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  className={cn(
                    'hero-slider__dot',
                    dotIndex === index && 'hero-slider__dot--active',
                  )}
                  onClick={() => goTo(dotIndex)}
                  aria-label={t('aria.slideOf', { n: dotIndex + 1, total: items.length })}
                  aria-current={dotIndex === index ? 'true' : undefined}
                />
              ))}
            </div>

            <button
              type="button"
              className="hero-slider__nav hero-slider__nav--prev"
              onClick={goPrev}
              aria-label={t('aria.prevSlide')}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="hero-slider__nav hero-slider__nav--next"
              onClick={goNext}
              aria-label={t('aria.nextSlide')}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>
    </section>
  )
}
