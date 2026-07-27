import Link from 'next/link'
import { BadgeCheck, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Property } from '@/lib/store'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14 0-.31-.01-.47-.01a.9.9 0 0 0-.65.31c-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  )
}

export function PropertyCard({ property }: { property: Property }) {
  const message = encodeURIComponent(
    `Hola, vi tu propiedad "${property.title}" en Renta Segura Mexicali y me interesa. ¿Sigue disponible?`,
  )
  const href = `https://wa.me/${property.whatsapp}?text=${message}`

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
      <Link
        href={`/propiedad/${property.id}`}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={`Ver detalles de ${property.title}`}
      >
        <img
          src={property.image || '/placeholder.svg'}
          alt={property.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-md">
          <BadgeCheck className="size-3.5" />
          Dueño Verificado
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="font-display text-xl font-extrabold tracking-tight text-foreground">
            {'$'}
            {property.price.toLocaleString('es-MX')}
            <span className="text-sm font-medium text-muted-foreground"> MXN / mes</span>
          </p>
          <h3 className="mt-1 text-pretty text-sm font-semibold leading-snug text-foreground">
            <Link
              href={`/propiedad/${property.id}`}
              className="transition-colors hover:text-primary"
            >
              {property.title}
            </Link>
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {property.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {property.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[0.7rem] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-auto h-11 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          nativeButton={false}
          render={<a href={href} target="_blank" rel="noopener noreferrer" />}
        >
          <WhatsAppIcon className="size-5" />
          Contactar por WhatsApp
        </Button>
      </div>
    </article>
  )
}
