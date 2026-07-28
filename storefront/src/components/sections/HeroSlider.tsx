'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useT } from '@/components/i18n/LocaleProvider'
import {
  HERO_IMAGE_SIZES,
  HERO_LCP_QUALITY,
  HERO_SLIDE_QUALITY,
  HERO_VIDEO_SRC,
} from '@/lib/hero-image'
import { cn } from '@/lib/utils'

export interface HeroSlide {
  id: string
  imageUrl: string
  alt: string
  width: number
  height: number
}

interface HeroSliderProps {
  slides: HeroSlide[]
}

const AUTOPLAY_MS = 6000

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    imageUrl: '',
    alt: '',
    width: 1600,
    height: 900,
  },
]

/**
 * useReducedMotion() is null on SSR and can be true on the client → hydration mismatch
 * if used for autoPlay / motion initial. Keep SSR + first client paint identical.
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
  const useHeroVideo = true
  const items = slides.length > 0 ? slides : FALLBACK_SLIDES
  const [index, setIndex] = useState(0)
  const reduceMotion = useHydrationSafeReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  /** null = pre-mount (treat as hidden); ghost = localhost preview; off = production */
  const [copyMode, setCopyMode] = useState<'off' | 'ghost' | null>(null)

  useEffect(() => {
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
    setCopyMode(isLocal ? 'ghost' : 'off')
  }, [])

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + items.length) % items.length)
    },
    [items.length],
  )

  const goNext = useCallback(() => goTo(index + 1), [goTo, index])
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (useHeroVideo || reduceMotion || items.length <= 1) return

    const timer = window.setInterval(goNext, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [goNext, items.length, reduceMotion, useHeroVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!useHeroVideo || !video) return

    if (reduceMotion) {
      video.pause()
      return
    }

    void video.play().catch(() => {
      // Autoplay may be blocked until user interaction; muted video usually succeeds.
    })
  }, [reduceMotion, useHeroVideo])

  const active = items[index]
  const hasImage = Boolean(active.imageUrl)
  const isLcpSlide = index === 0
  const showSlideControls = !useHeroVideo && items.length > 1
  const showCopy = copyMode === 'ghost'
  const heroAriaLabel = t('hero.title')

  return (
    <section
      className="theme-transition noor-reveal noor-hero-section hero-slider relative overflow-hidden bg-(--color-surface)"
      aria-labelledby={showCopy ? 'hero-heading' : undefined}
      aria-label={showCopy ? undefined : heroAriaLabel}
    >
      <div className="hero-slider__stage relative w-full min-h-112 sm:min-h-128 lg:min-h-144">
        {useHeroVideo ? (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="hero-slider__video absolute inset-0 h-full w-full object-cover object-center"
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source src={HERO_VIDEO_SRC} type="video/mp4" />
            </video>
            <div className="hero-slider__overlay absolute inset-0" aria-hidden="true" />
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={active.id}
              className="absolute inset-0"
              initial={reduceMotion || isLcpSlide ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              {hasImage ? (
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
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface-2) 45%, var(--color-surface) 100%)',
                  }}
                  aria-hidden="true"
                />
              )}

              <div className="hero-slider__overlay absolute inset-0" aria-hidden="true" />
            </m.div>
          </AnimatePresence>
        )}

        {showCopy && (
          <Container className="relative z-10 flex h-full min-h-[inherit] items-end justify-start py-8 sm:py-10 lg:pb-12 lg:pt-16">
            <m.div
              className="hero-slider__copy hero-slider__copy--dev-ghost liquid-glass liquid-glass--heavy"
              initial={false}
              animate={{ opacity: 0.2, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15 }}
            >
              <p className="section-label hero-slider__eyebrow">{t('hero.eyebrow')}</p>
              <h1
                id="hero-heading"
                className="noor-display-heading hero-slider__title font-extrabold leading-tight text-balance text-(--color-text)"
              >
                {t('hero.title')}
              </h1>
              <p className="hero-slider__subtitle leading-relaxed text-(--color-text-muted)">
                <span className="sm:hidden">{t('hero.subtitleShort')}</span>
                <span className="hidden sm:inline">{t('hero.subtitle')}</span>
              </p>
              <Link
                href="/produkty"
                id="hero-cta-primary"
                className="btn btn-primary hero-slider__cta noor-pill-cta w-full sm:w-auto"
                tabIndex={-1}
                aria-hidden="true"
              >
                {t('hero.cta')}
              </Link>
            </m.div>
          </Container>
        )}

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
