'use client'

import { useState, useEffect } from 'react'
import { useThemeToast } from '@/components/ui/ThemeToast'

const COOKIE_KEY = 'gm_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const { toast } = useThemeToast()

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
    toast({
      title: 'Cookies prijaté',
      description: 'Ďakujeme, nastavenia boli uložené.',
      variant: 'success',
    })
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Súhlas s cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div
        className="max-w-4xl mx-auto rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-white border border-(--color-border)"
        style={{ boxShadow: '0 -4px 30px rgba(16, 22, 21, 0.1)' }}
      >
        <div className="flex-1 text-sm leading-relaxed text-[#4B5563]">
          <p className="font-semibold text-[#101615] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Používame cookies
          </p>
          <p>
            Táto stránka používa cookies na zlepšenie vášho zážitku z prehliadania.
            Viac informácií nájdete v sekcii{' '}
            <a
              href="/ochrana-osobnych-udajov"
              className="text-[#166534] underline hover:text-[#14532d] transition-colors"
            >
              Ochrana osobných údajov
            </a>.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[#4B5563] hover:text-[#101615] border border-[#E5E7EB] hover:border-[#166534] transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Odmietnuť
          </button>
          <button
            onClick={accept}
            className="btn btn-primary px-5 py-2.5 !text-white !bg-[#166534] !border-[#166534] hover:!bg-[#14532d] hover:!border-[#14532d]"
          >
            Prijať všetky
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
