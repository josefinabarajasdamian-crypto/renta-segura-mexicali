import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { HeroSection } from '@/components/hero-section'
import { ListingsSection } from '@/components/listings-section'
import { SiteFooter } from '@/components/site-footer'

// La página lee filtros de búsqueda de la URL (?q=&zone=&budget=). Si se
// prerenderizara como estática, el HTML fijo del build nunca reflejaría
// esos filtros y el cliente terminaría reconciliando contra un HTML que no
// coincide — la forzamos a renderizarse por request para evitar eso.
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <Suspense fallback={null}>
          <ListingsSection />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
