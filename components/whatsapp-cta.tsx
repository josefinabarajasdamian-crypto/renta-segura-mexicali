'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { cn } from '@/lib/utils'

export function WhatsAppCta({
  phone,
  message,
  label = 'Contactar por WhatsApp',
  className,
  showPreview = true,
}: {
  phone: string
  message: string
  label?: string
  className?: string
  showPreview?: boolean
}) {
  const [open, setOpen] = useState(false)
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <div className="relative w-full">
      {showPreview && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-full left-0 right-0 mb-2 origin-bottom rounded-xl border border-border bg-popover p-3 text-left text-xs leading-relaxed text-popover-foreground shadow-lg transition-all duration-200',
            open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          <p className="mb-1 font-semibold text-accent">Mensaje prellenado:</p>
          <p className="text-muted-foreground">{`"${message}"`}</p>
        </div>
      )}
      <Button
        size="lg"
        nativeButton={false}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          'h-12 w-full gap-2 bg-accent text-base font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 hover:shadow-lg',
          className,
        )}
        render={<a href={href} target="_blank" rel="noopener noreferrer" />}
      >
        <WhatsAppIcon className="size-5" />
        {label}
      </Button>
    </div>
  )
}
