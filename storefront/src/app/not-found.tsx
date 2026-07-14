import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'

export default async function NotFound() {
  const locale = await getRequestLocale()

  return (
    <div className="py-20 bg-(--color-surface-2) min-h-[60vh] flex items-center">
      <Container>
        <EmptyState
          icon="error"
          title={t('empty.notFound.title', locale)}
          description={t('empty.notFound.description', locale)}
          actionLabel={t('empty.notFound.action', locale)}
          actionHref="/"
        />
      </Container>
    </div>
  )
}
