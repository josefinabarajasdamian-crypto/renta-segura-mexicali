import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { HeroSection } from '@/components/hero-section'
import { ListingsSection } from '@/components/listings-section'
import { SiteFooter } from '@/components/site-footer'

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
