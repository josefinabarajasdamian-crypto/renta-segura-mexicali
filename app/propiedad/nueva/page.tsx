'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ShieldCheck, Rocket, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardProgress } from '@/components/property-wizard/wizard-progress'
import { StepLocation } from '@/components/property-wizard/step-location'
import { StepClimate } from '@/components/property-wizard/step-climate'
import { StepRules } from '@/components/property-wizard/step-rules'
import { StepPreview } from '@/components/property-wizard/step-preview'
import { PublishSuccessModal } from '@/components/property-wizard/publish-success-modal'
import { defaultFormData, wizardSteps, type PropertyFormData } from '@/components/property-wizard/types'
import { saveProperty } from '@/lib/store'

const IMAGE_BY_TYPE: Record<string, string> = {
  Departamento: '/images/depto-uabc.png',
  Casa: '/images/casa-prohogar.png',
  Cuarto: '/images/studio-palaco.png',
  Estudio: '/images/studio-palaco.png',
}

const OWNER_WHATSAPP = '526861112233'

function buildTags(data: PropertyFormData): string[] {
  const tags: string[] = []
  if (data.coolingType && data.coolingType !== 'Ninguno') tags.push(data.coolingType)
  if (data.bedrooms > 0) tags.push(`${data.bedrooms} Recámaras`)
  if (data.servicesIncluded.water) tags.push('Agua Incluida')
  if (data.servicesIncluded.internet) tags.push('Internet Incluido')
  if (data.petsPolicy !== 'No acepta') tags.push('Acepta Mascotas')
  return tags.slice(0, 4)
}

export default function NuevaPropiedadPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<PropertyFormData>(defaultFormData)
  const [shortLink, setShortLink] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

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

  async function publish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const created = await saveProperty({
        image: IMAGE_BY_TYPE[formData.propertyType] ?? '/images/depto-uabc.png',
        price: Number(formData.rentPrice) || 0,
        title: `${formData.propertyType || 'Propiedad'} en ${formData.zone || 'Mexicali'}`,
        location: `${formData.zone || 'Mexicali'}, Mexicali`,
        zone: formData.zone,
        tags: buildTags(formData),
        whatsapp: OWNER_WHATSAPP,
        propertyType: formData.propertyType,
        deposit: Number(formData.deposit) || undefined,
        contractDuration: formData.contractDuration,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        parking: formData.parking,
        coolingType: formData.coolingType,
        coolingUnits: formData.coolingUnits,
        electricityRate: formData.electricityRate,
        petsPolicy: formData.petsPolicy,
      })
      setShortLink(created.id)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'No se pudo publicar la propiedad.')
    } finally {
      setPublishing(false)
    }
  }

  function goToDashboard() {
    router.push('/dashboard')
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
        {publishError && (
          <div className="mx-auto flex max-w-2xl items-start gap-2 px-4 pt-3 text-destructive sm:px-6">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">{publishError}</p>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            size="lg"
            className="gap-1.5"
            onClick={goBack}
            disabled={step === 1 || publishing}
          >
            <ArrowLeft className="size-4" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button size="lg" className="flex-1 gap-1.5" onClick={publish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              <span className="hidden sm:inline">
                {publishing ? 'Publicando...' : 'Publicar y Obtener Enlace para Facebook'}
              </span>
              <span className="sm:hidden">{publishing ? 'Publicando...' : 'Publicar y Obtener Enlace'}</span>
            </Button>
          ) : (
            <Button size="lg" className="flex-1 gap-1.5" onClick={goNext}>
              Siguiente
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {shortLink && <PublishSuccessModal shortLink={shortLink} onClose={goToDashboard} />}
    </div>
  )
}
