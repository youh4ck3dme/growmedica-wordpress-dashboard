'use client'

import { useT } from '@/components/i18n/LocaleProvider'

export function KontaktForm() {
  const t = useT()

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
      <h2 className="text-2xl font-bold text-(--color-text) mb-8 font-montserrat">
        {t('page.contact.formTitle')}
      </h2>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          alert(t('page.contact.demoAlert'))
        }}
      >
        <div>
          <label className="block text-sm font-semibold text-(--color-text) mb-2">
            {t('page.contact.nameLabel')}
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:border-(--color-accent-green) focus:ring-1 focus:ring-(--color-accent-green) outline-none transition-shadow"
            placeholder={t('page.contact.namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-(--color-text) mb-2">
            {t('page.contact.emailFieldLabel')}
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:border-(--color-accent-green) focus:ring-1 focus:ring-(--color-accent-green) outline-none transition-shadow"
            placeholder={t('page.contact.emailPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-(--color-text) mb-2">
            {t('page.contact.messageLabel')}
          </label>
          <textarea
            rows={4}
            required
            className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:border-(--color-accent-green) focus:ring-1 focus:ring-(--color-accent-green) outline-none transition-shadow"
            placeholder={t('page.contact.messagePlaceholder')}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full py-4 text-lg">
          {t('page.contact.submit')}
        </button>
      </form>
    </div>
  )
}
