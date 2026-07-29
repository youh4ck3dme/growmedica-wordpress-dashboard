'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { useT } from '@/components/i18n/LocaleProvider'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const t = useT()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useThemeToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast({
        title: t('auth.errorTitle'),
        description: t('auth.errorFill'),
        variant: 'error',
      })
      return
    }

    if (mode === 'register' && password.length < 8) {
      toast({
        title: t('auth.errorTitle'),
        description: t('auth.errorPasswordShort'),
        variant: 'error',
      })
      return
    }

    setIsLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      })
      const data = (await response.json()) as { error?: string; customer?: { name: string } }
      if (!response.ok) {
        throw new Error(data.error || t('auth.errorGeneric'))
      }

      toast({
        title: t('auth.successTitle'),
        description: t('auth.welcomeBack', { name: data.customer?.name ?? email.trim() }),
        variant: 'success',
      })
      window.dispatchEvent(new Event('auth-updated'))
      router.push('/profil')
      router.refresh()
    } catch (err) {
      toast({
        title: t('auth.errorTitle'),
        description: err instanceof Error ? err.message : t('auth.errorGeneric'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-12 lg:py-20 bg-gray-50/50 min-h-screen flex items-center">
      <Container>
        <div className="max-w-md mx-auto bg-white border border-(--color-border) rounded-2xl p-6 md:p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-(--color-text) flex items-center justify-center gap-2">
              {mode === 'login' ? (
                <LogIn className="h-6 w-6 text-(--color-primary)" />
              ) : (
                <UserPlus className="h-6 w-6 text-(--color-primary)" />
              )}
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h1>
            <p className="text-xs text-(--color-text-muted)">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="first-name-input"
                    className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5"
                  >
                    {t('auth.firstNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="first-name-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last-name-input"
                    className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5"
                  >
                    {t('auth.lastNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="last-name-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5"
              >
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email-input"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-(--color-border) focus:border-(--color-primary-bright) focus:ring-1 focus:ring-(--color-primary-bright) outline-none transition-all"
                />
                <Mail className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-(--color-text-light)" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-bold uppercase tracking-wider text-(--color-text-muted) mb-1.5"
              >
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password-input"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                {mode === 'login' ? t('auth.submit') : t('auth.registerSubmit')}
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-(--color-text-muted)">
            {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button
              type="button"
              className="font-semibold text-(--color-primary) hover:underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </button>
          </p>

          <p className="text-[11px] text-center text-(--color-text-light) leading-relaxed">
            {t('auth.accountOnCmsHint')}
          </p>
        </div>
      </Container>
    </div>
  )
}
