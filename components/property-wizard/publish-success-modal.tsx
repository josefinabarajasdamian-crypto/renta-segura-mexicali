'use client'

import { useState } from 'react'
import { PartyPopper, Link2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export function PublishSuccessModal({
  shortLink,
  onClose,
}: {
  shortLink: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const fullLink = `rentasegura.mx/p/${shortLink}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `¡Mira esta propiedad en Renta Segura Mexicali! https://${fullLink}`,
  )}`

  function copyLink() {
    navigator.clipboard?.writeText(`https://${fullLink}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <PartyPopper className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">
            ¡Tu propiedad ya está publicada!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte tu enlace para recibir más inquilinos interesados.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm font-semibold text-foreground">{fullLink}</span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" size="lg" className="gap-1.5" onClick={copyLink}>
            {copied ? <Check className="size-4 text-accent" /> : <Link2 className="size-4" />}
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </Button>
          <Button
            size="lg"
            nativeButton={false}
            render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}
            className="gap-1.5 bg-[#25D366] text-white hover:bg-[#25D366]/90"
          >
            <WhatsAppIcon className="size-4" />
            Compartir en WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}
