'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useThemeToast } from '@/components/ui/ThemeToast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useThemeToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Chyba',
        description: 'Vyplňte e-mail a heslo.',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)

    // Simulate login
    setTimeout(() => {
      const mockUser = {
        name: 'Jozef Novák',
        email: email.trim(),
        points: 150,
        tier: 'BRONZE',
        addresses: [
          {
            street: 'Hlavná 12',
            city: 'Bratislava',
            zip: '811 01',
            country: 'Slovensko',
          },
        ],
      }

      localStorage.setItem('gm_user_session', JSON.stringify(mockUser))
      
      // Initialize loyalty ledger if empty
      if (!localStorage.getItem('gm_loyalty_transactions')) {
        const initialTransactions = [
          { id: 't1', amount: 100, description: 'Uvítacie body za registráciu', date: '2026-05-15' },
          { id: 't2', amount: 50, description: 'Body za nákup - Objednávka #1001', date: '2026-06-01' },
        ]
        localStorage.setItem('gm_loyalty_transactions', JSON.stringify(initialTransactions))
      }

      toast({
        title: 'Prihlásenie úspešné',
        description: `Vitajte späť, ${mockUser.name}!`,
        variant: 'success',
      })
      
      setIsLoading(false)
      router.push('/profil')
      
      // Notify header/other components that login state updated
      window.dispatchEvent(new Event('auth-updated'))
    }, 1000)
  }

  const handleSocialMock = (provider: string) => {
    setIsLoading(true)
    setTimeout(() => {
      const mockUser = {
        name: 'Jozef Novák',
        email: 'jozef.novak@gmail.com',
        points: 250,
        tier: 'SILVER',
        addresses: [
          {
            street: 'Hlavná 12',
            city: 'Bratislava',
            zip: '811 01',
            country: 'Slovensko',
          },
        ],
      }
      localStorage.setItem('gm_user_session', JSON.stringify(mockUser))

      if (!localStorage.getItem('gm_loyalty_transactions')) {
        const initialTransactions = [
          { id: 't1', amount: 150, description: 'Uvítacie body za registráciu', date: '2026-05-15' },
          { id: 't2', amount: 100, description: 'Body za nákup - Objednávka #1001', date: '2026-06-01' },
        ]
        localStorage.setItem('gm_loyalty_transactions', JSON.stringify(initialTransactions))
      }

      toast({
        title: 'Prihlásenie úspešné',
        description: `Prihlásený cez ${provider} ako Jozef Novák.`,
        variant: 'success',
      })
      setIsLoading(false)
      router.push('/profil')
      window.dispatchEvent(new Event('auth-updated'))
    }, 800)
  }

  return (
    <div className="py-12 lg:py-20 bg-gray-50/50 min-h-screen flex items-center">
      <Container>
        <div className="max-w-md mx-auto bg-white border border-(--color-border) rounded-2xl p-6 md:p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-(--color-text) flex items-center justify-center gap-2">
              <LogIn className="h-6 w-6 text-(--color-primary)" />
              Prihlásenie do účtu
            </h1>
            <p className="text-xs text-(--color-text-muted)">
              Získajte body za nákupy a uplatnite si ich na zľavy!
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5">
                E-mailová adresa *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="napr. jozef@email.sk"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                />
                <Mail className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-(--color-text-light)" />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5">
                Heslo *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-(--color-text-light)" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                Prihlásiť sa
              </Button>
            </div>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-(--color-border)"></div>
            <span className="flex-shrink mx-4 text-xs text-(--color-text-light) uppercase font-bold">alebo</span>
            <div className="flex-grow border-t border-(--color-border)"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialMock('Google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-(--color-border) hover:bg-gray-50 rounded-lg p-2.5 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.94 5.94 0 018 12.63c0-3.26 2.612-5.94 5.99-5.94 1.56 0 2.97.585 4.04 1.575l3.11-3.11A9.97 9.97 0 0013.99 2C8.47 2 4 6.47 4 12s4.47 10 9.99 10c5.52 0 10.01-4.47 10.01-10 0-.765-.09-1.53-.27-2.265H12.24z"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => handleSocialMock('Apple')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-(--color-border) hover:bg-gray-50 rounded-lg p-2.5 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.1.31.1.86 0 1.9-.52 2.5-1.43z"/>
              </svg>
              Apple
            </button>
          </div>
        </div>
      </Container>
    </div>
  )
}
