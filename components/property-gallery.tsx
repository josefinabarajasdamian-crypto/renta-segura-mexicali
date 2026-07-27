'use client'

import { useState } from 'react'
import { Expand } from 'lucide-react'
import { cn } from '@/lib/utils'

type GalleryImage = { src: string; alt: string }

export function PropertyGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0)

  return (
    <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <img
          src={images[active].src || '/placeholder.svg'}
          alt={images[active].alt}
          className="aspect-[4/3] size-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-auto sm:h-full"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          <Expand className="size-3.5" />
          {active + 1} / {images.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-2">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ver ${img.alt}`}
            aria-pressed={active === i}
            className={cn(
              'group relative overflow-hidden rounded-xl border-2 bg-card shadow-sm transition-all',
              active === i
                ? 'border-primary ring-2 ring-primary/25'
                : 'border-transparent hover:border-primary/40',
            )}
          >
            <img
              src={img.src || '/placeholder.svg'}
              alt={img.alt}
              className="aspect-[4/3] size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
