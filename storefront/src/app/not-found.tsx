import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotFound() {
  return (
    <div className="py-20 bg-(--color-surface-2) min-h-[60vh] flex items-center">
      <Container>
        <EmptyState
          icon="error"
          title="Stránka nebola nájdená"
          description="Ospravedlňujeme sa, ale požadovaná stránka neexistuje alebo bola presunutá."
          actionLabel="Späť na domovskú stránku"
          actionHref="/"
        />
      </Container>
    </div>
  )
}
