'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ShieldCheck, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardProgress } from '@/components/property-wizard/wizard-progress'
import { StepLocation } from '@/components/property-wizard/step-location'
import { StepClimate } from '@/components/property-wizard/step-climate'
import { StepRules } from '@/components/property-wizard/step-rules'
import { StepPreview } from '@/components/property-wizard/step-preview'
import { PublishSuccessModal } from '@/components/property-wizard/publish-success-modal'
import { defaultFormData, wizardSteps, type PropertyFormData } from '@/components/property-wizard/types'

export default function NuevaPropiedadPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<PropertyFormData>(defaultFormData)
  const [shortLink, setShortLink] = useState<string | null>(null)

  const totalSteps = wizardSteps.length
  const isLastStep = step === totalSteps

  function update(patch: Partial<PropertyFormData>) {
    setFormData((prev) => ({ ...prev, ...patch }))
  }

  function goNext() {
    if (!isLastStep) setStep((s) => s + 1)
  }

  function goBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  function publish() {
    const id = Math.random().toString(36).slice(2, 8)
    setShortLink(id)
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            aria-label="Volver al panel"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              Renta Segura Mexicali
            </p>
            <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-foreground">
              Publicar Nueva Propiedad
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <WizardProgress currentStep={step} />

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          {step === 1 && <StepLocation data={formData} update={update} />}
          {step === 2 && <StepClimate data={formData} update={update} />}
          {step === 3 && <StepRules data={formData} update={update} />}
          {step === 4 && <StepPreview data={formData} />}
        </div>
      </main>

      {/* Sticky mobile-first action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            size="lg"
            className="gap-1.5"
            onClick={goBack}
            disabled={step === 1}
          >
            <ArrowLeft className="size-4" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button size="lg" className="flex-1 gap-1.5" onClick={publish}>
              <Rocket className="size-4" />
              <span className="hidden sm:inline">Publicar y Obtener Enlace para Facebook</span>
              <span className="sm:hidden">Publicar y Obtener Enlace</span>
            </Button>
          ) : (
            <Button size="lg" className="flex-1 gap-1.5" onClick={goNext}>
              Siguiente
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {shortLink && (
        <PublishSuccessModal shortLink={shortLink} onClose={() => setShortLink(null)} />
      )}
    </div>
  )
}
