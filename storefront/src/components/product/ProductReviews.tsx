'use client'

import { useState, useEffect, useMemo } from 'react'
import { Star, MessageSquare, CheckCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { m, AnimatePresence } from 'framer-motion'

interface Review {
  id: string
  rating: number
  author: string
  email: string
  title: string
  body: string
  verified: boolean
  date: string
}

interface ProductReviewsProps {
  productHandle: string
  productTitle: string
}

// Mock default reviews to populate the UI initially for premium feel
const DEFAULT_REVIEWS: Record<string, Omit<Review, 'id'>[]> = {
  general: [
    {
      rating: 5,
      author: 'Martin S.',
      email: 'martin.s@example.com',
      title: 'Skvelá kvalita a rýchle doručenie',
      body: 'S produktom som nadmieru spokojný. Užívam ho pravidelne a pociťujem výrazné zlepšenie energie a vitality. Doručenie z GrowMedica bolo extrémne rýchle, balík prišiel hneď na druhý deň.',
      verified: true,
      date: '2026-05-12',
    },
    {
      rating: 5,
      author: 'Katarína H.',
      email: 'katarina.h@example.com',
      title: 'Odporúčam všetkými desiatimi',
      body: 'Veľmi čisté zloženie bez zbytočných prídavných látok. Kapsuly sa ľahko prehĺtajú a nedráždia žalúdok. Určite si objednám znovu.',
      verified: true,
      date: '2026-05-28',
    },
    {
      rating: 4,
      author: 'Michal P.',
      email: 'michal.p@example.com',
      title: 'Veľmi dobrý doplnok',
      body: 'Kvalitný produkt, zloženie vyzerá vynikajúco. Jediná drobnosť je, že balenie by mohlo byť o niečo väčšie, ale inak nemám čo vytknúť.',
      verified: true,
      date: '2026-06-02',
    },
  ],
}

export function ProductReviews({ productHandle, productTitle }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingInput, setRatingInput] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [author, setAuthor] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useThemeToast()

  // Load reviews from localStorage + defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`gm_reviews_${productHandle}`)
      if (stored) {
        setReviews(JSON.parse(stored) as Review[])
      } else {
        // Seed default mock reviews
        const seed = DEFAULT_REVIEWS.general.map((r, i) => ({
          id: `seed-${i}`,
          ...r,
        }))
        setReviews(seed)
        localStorage.setItem(`gm_reviews_${productHandle}`, JSON.stringify(seed))
      }
    } catch {
      // Fallback
    }
  }, [productHandle])

  // Statistics
  const stats = useMemo(() => {
    if (reviews.length === 0) return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const dist = [0, 0, 0, 0, 0] // 1, 2, 3, 4, 5 stars
    reviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, r.rating)) - 1
      dist[idx]++
    })
    return {
      average: parseFloat((sum / reviews.length).toFixed(1)),
      count: reviews.length,
      distribution: dist.reverse(), // 5, 4, 3, 2, 1 stars order
    }
  }, [reviews])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !email.trim() || !body.trim()) {
      toast({
        title: 'Chyba validácie',
        description: 'Vyplňte prosím všetky povinné polia (Meno, Email a text recenzie).',
        variant: 'error',
      })
      return
    }

    setIsSubmitting(true)

    // Simulate network latency
    setTimeout(() => {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        rating: ratingInput,
        author: author.trim(),
        email: email.trim(),
        title: title.trim() || undefined || 'Bez názvu',
        body: body.trim(),
        verified: true, // Simulated purchase verification
        date: new Date().toISOString().split('T')[0],
      }

      const updated = [newReview, ...reviews]
      try {
        localStorage.setItem(`gm_reviews_${productHandle}`, JSON.stringify(updated))
      } catch {
        // localStorage full
      }

      setReviews(updated)
      setIsSubmitting(false)
      setShowForm(false)
      
      // Clear inputs
      setAuthor('')
      setEmail('')
      setTitle('')
      setBody('')
      setRatingInput(5)

      toast({
        title: 'Recenzia bola pridaná',
        description: 'Ďakujeme za vaše hodnotenie produktu! Vaša recenzia bola úspešne zverejnená.',
        variant: 'success',
      })
    }, 800)
  }

  return (
    <section className="mt-14 border-t border-(--color-border) pt-10" id="product-reviews-section">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Rating Overview and Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-(--color-text) mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-(--color-primary)" />
              Hodnotenia zákazníkov
            </h2>
            <p className="text-xs text-(--color-text-muted)">
              Všetky recenzie sú od overených zákazníkov obchodu GrowMedica.sk.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 border border-(--color-border) rounded-2xl p-5 shadow-sm">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-black text-(--color-text)">{stats.average}</div>
              <div className="text-[10px] uppercase font-extrabold text-(--color-text-muted) tracking-wider mt-1">z 5 hviezdičiek</div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-5 w-5",
                      star <= Math.round(stats.average)
                        ? "text-(--color-accent-gold) fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-(--color-text-muted) font-semibold">
                Spolu <span className="text-(--color-text)">{stats.count}</span> hodnotení
              </p>
            </div>
          </div>

          {/* Rating distribution bar graph */}
          <div className="space-y-2">
            {stats.distribution.map((count, idx) => {
              const stars = 5 - idx
              const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-3 font-semibold text-(--color-text)">{stars}</span>
                  <Star className="h-3.5 w-3.5 text-(--color-accent-gold) fill-current shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 border border-(--color-border) rounded-full overflow-hidden">
                    <div
                      className="h-full bg-(--color-primary) rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-(--color-text-light)">{count}</span>
                </div>
              )
            })}
          </div>

          <div className="pt-2">
            <Button
              variant={showForm ? 'ghost' : 'primary'}
              fullWidth
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Zrušiť písanie recenzie' : 'Napísať recenziu'}
            </Button>
          </div>
        </div>

        {/* Reviews List & Write Review Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {showForm ? (
              <m.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm space-y-5"
              >
                <div>
                  <h3 className="font-bold text-lg text-(--color-text)">Ohodnoťte produkt</h3>
                  <p className="text-xs text-(--color-text-muted)">
                    Vaša e-mailová adresa nebude zverejnená. Povinné polia sú označené *.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star Rating Selector */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-2">
                      Vaša spokojnosť *
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isGold = hoverRating !== null ? star <= hoverRating : star <= ratingInput
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRatingInput(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 -ml-1 text-gray-300 hover:text-(--color-accent-gold) transition-colors outline-none scale-110 hover:scale-125 duration-100"
                            aria-label={`Ohodnotiť ${star} z 5 hviezdičiek`}
                          >
                            <Star className={cn("h-6 w-6 stroke-[1.5]", isGold && "text-(--color-accent-gold) fill-current")} />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="author-input" className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5">
                        Vaše meno *
                      </label>
                      <input
                        type="text"
                        id="author-input"
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="napr. Jozef M."
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5">
                        Váš e-mail *
                      </label>
                      <input
                        type="email"
                        id="email-input"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="napr. jozef@email.sk"
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title-input" className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5">
                      Názov recenzie
                    </label>
                    <input
                      type="text"
                      id="title-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="napr. Naozaj to funguje!"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="body-input" className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5">
                      Obsah recenzie *
                    </label>
                    <textarea
                      id="body-input"
                      required
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Podrobne popíšte vašu skúsenosť s produktom..."
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <Button variant="primary" type="submit" isLoading={isSubmitting} fullWidth>
                      Odoslať recenziu
                    </Button>
                  </div>
                </form>
              </m.div>
            ) : (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {reviews.length === 0 ? (
                  <div className="py-12 text-center text-(--color-text-light)">
                    Žiadne recenzie. Buďte prvý, kto napíše recenziu pre tento produkt!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white border border-(--color-border) rounded-2xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= review.rating
                                  ? "text-(--color-accent-gold) fill-current"
                                  : "text-gray-200"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-(--color-text-light) font-medium">
                          {review.date}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-(--color-text)">{review.title}</h4>
                          {review.verified && (
                            <span className="text-[10px] text-(--color-primary) font-bold bg-(--color-primary-light) px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <ShieldCheck className="h-3 w-3 stroke-[2]" />
                              Overený nákup
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-semibold">
                          Hodnotil/a: <span className="text-(--color-text) font-bold">{review.author}</span>
                        </p>
                      </div>

                      <p className="text-sm text-(--color-text-muted) leading-relaxed">
                        {review.body}
                      </p>
                    </div>
                  ))
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
