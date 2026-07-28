'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ShieldCheck,
  ImageUp,
  Camera,
  Images,
  Loader2,
  Sparkles,
  TriangleAlert,
  Rocket,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/property-wizard/form-field'
import { CounterInput } from '@/components/property-wizard/counter-input'
import { ToggleRow } from '@/components/property-wizard/toggle-switch'
import { PhotoPicker } from '@/components/property-wizard/photo-picker'
import { mexicaliZones } from '@/lib/data'
import { saveProperty } from '@/lib/store'
import { uploadPropertyImages } from '@/lib/supabase'

type ScanStatus = 'idle' | 'scanning' | 'scanned' | 'error'

interface ScanResult {
  titulo: string | null
  precio: number | null
  zona: string | null
  clima: string | null
  recamaras: number | null
  banos: number | null
  mascotas: boolean
  serviciosIncluidos: string[]
  telefono: string | null
  descripcion: string | null
}

interface FormState {
  titulo: string
  precio: string
  zona: string
  clima: string
  recamaras: number
  banos: number
  mascotas: boolean
  agua: boolean
  internet: boolean
  gas: boolean
  mantenimiento: boolean
  telefono: string
  descripcion: string
}

const emptyForm: FormState = {
  titulo: '',
  precio: '',
  zona: '',
  clima: '',
  recamaras: 1,
  banos: 1,
  mascotas: false,
  agua: false,
  internet: false,
  gas: false,
  mantenimiento: false,
  telefono: '',
  descripcion: '',
}

function resizeImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo leer la imagen'))
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('52')) return digits
  if (digits.length === 10) return `52${digits}`
  return digits
}

function applyScanResult(data: ScanResult): FormState {
  const servicios = (data.serviciosIncluidos || []).map((s) => s.toLowerCase())
  const has = (keyword: string) => servicios.some((s) => s.includes(keyword))

  return {
    titulo: data.titulo || '',
    precio: data.precio ? String(data.precio) : '',
    zona: data.zona || '',
    clima: data.clima || '',
    recamaras: data.recamaras ?? 1,
    banos: data.banos ?? 1,
    mascotas: Boolean(data.mascotas),
    agua: has('agua'),
    internet: has('internet') || has('wifi'),
    gas: has('gas'),
    mantenimiento: has('mantenimiento'),
    telefono: data.telefono || '',
    descripcion: data.descripcion || '',
  }
}

export default function ImportarPage() {
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [extraPhotos, setExtraPhotos] = useState<File[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  function update(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setForm(emptyForm)

    let dataUrl: string
    try {
      dataUrl = await resizeImage(file)
    } catch {
      setStatus('error')
      setErrorMessage('No se pudo leer esa imagen. Intenta con otra foto o captura de pantalla.')
      return
    }

    setImagePreview(dataUrl)
    setStatus('scanning')

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setStatus('error')
        setErrorMessage(json.error || 'No se pudo analizar la imagen.')
        return
      }

      const parsed = applyScanResult(json.data as ScanResult)
      setForm(parsed)
      setStatus('scanned')

      if (!parsed.titulo && !parsed.precio && !parsed.zona) {
        setErrorMessage(
          'La IA no encontró información clara de una renta en esta imagen. Revisa y completa los campos manualmente.',
        )
      }
    } catch {
      setStatus('error')
      setErrorMessage('No se pudo conectar con el analizador de imágenes. Intenta de nuevo.')
    }
  }

  function reset() {
    setImagePreview(null)
    setStatus('idle')
    setErrorMessage(null)
    setForm(emptyForm)
    setExtraPhotos([])
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  async function publish() {
    setPublishing(true)
    setPublishError(null)

    const servicios: string[] = []
    if (form.agua) servicios.push('Agua Incluida')
    if (form.internet) servicios.push('Internet Incluido')
    if (form.gas) servicios.push('Gas Incluido')
    if (form.mantenimiento) servicios.push('Mantenimiento Incluido')

    const tags = [
      ...(form.clima ? [form.clima] : []),
      ...(form.recamaras ? [`${form.recamaras} Recámaras`] : []),
      ...(form.mascotas ? ['Acepta Mascotas'] : []),
      ...servicios,
    ].slice(0, 5)

    try {
      const filesToUpload = [
        ...(imagePreview ? [dataUrlToBlob(imagePreview)] : []),
        ...extraPhotos,
      ]
      const uploadedImages =
        filesToUpload.length > 0 ? await uploadPropertyImages(filesToUpload) : []

      await saveProperty({
        images: uploadedImages.length > 0 ? uploadedImages : ['/images/depto-uabc.png'],
        price: Number(form.precio) || 0,
        title: form.titulo || `Propiedad en ${form.zona || 'Mexicali'}`,
        location: `${form.zona || 'Mexicali'}, Mexicali`,
        zone: form.zona,
        tags,
        whatsapp: normalizeWhatsapp(form.telefono) || '526860000000',
        bedrooms: form.recamaras,
        bathrooms: form.banos,
        coolingType: form.clima || undefined,
        petsPolicy: form.mascotas ? 'Cualquier mascota' : 'No acepta',
        description: form.descripcion || undefined,
      })
      router.push('/')
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'No se pudo publicar la propiedad.')
      setPublishing(false)
    }
  }

  const showForm = status === 'scanned' || (status === 'error' && imagePreview)
  const canPublish = form.titulo.trim() !== '' && Number(form.precio) > 0 && form.zona.trim() !== ''

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
              Importar desde Facebook con IA
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-2.5 text-primary">
          <Sparkles className="size-4 shrink-0" />
          <p className="text-xs font-semibold">
            Sube una captura de pantalla de una publicación de renta y la IA llenará el formulario
            por ti.
          </p>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!imagePreview ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageUp className="size-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Sube una foto o captura de pantalla
              </p>
              <p className="text-xs text-muted-foreground">PNG o JPG desde tu dispositivo</p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-1.5"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="size-4" />
                Tomar foto
              </Button>
              <Button
                type="button"
                size="lg"
                className="gap-1.5"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Images className="size-4" />
                Subir de galería
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <img src={imagePreview} alt="Publicación importada" className="max-h-72 w-full object-cover" />
            <div className="flex items-center justify-between gap-3 p-3">
              {status === 'scanning' ? (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Loader2 className="size-4 animate-spin" />
                  Analizando imagen con IA...
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Revisa y corrige los datos si es necesario.
                </span>
              )}
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
                <RotateCcw className="size-3.5" />
                Otra imagen
              </Button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {showForm && (
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <FormField label="Título">
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => update({ titulo: e.target.value })}
                placeholder="Ej. Departamento 2 recámaras en Palaco"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Renta mensual (MXN)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.precio}
                    onChange={(e) => update({ precio: e.target.value })}
                    placeholder="6,500"
                    className="h-11 w-full rounded-xl border border-input bg-background pl-8 pr-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
                  />
                </div>
              </FormField>
              <FormField label="Teléfono / WhatsApp">
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => update({ telefono: e.target.value })}
                  placeholder="686 123 4567"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </FormField>
            </div>

            <FormField label="Zona / Fraccionamiento">
              <input
                type="text"
                list="mexicali-zonas-importar"
                value={form.zona}
                onChange={(e) => update({ zona: e.target.value })}
                placeholder="Ej. UABC Central, Palaco, Prohogar..."
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
              />
              <datalist id="mexicali-zonas-importar">
                {mexicaliZones.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Clima / Equipamiento" hint="Lo que la IA detectó sobre minisplits o aire">
              <input
                type="text"
                value={form.clima}
                onChange={(e) => update({ clima: e.target.value })}
                placeholder="Ej. 2 Minisplits Inverter"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Recámaras">
                <CounterInput
                  value={form.recamaras}
                  onChange={(v) => update({ recamaras: v })}
                  min={0}
                  max={10}
                />
              </FormField>
              <FormField label="Baños">
                <CounterInput
                  value={form.banos}
                  onChange={(v) => update({ banos: v })}
                  min={0}
                  max={10}
                />
              </FormField>
            </div>

            <div className="space-y-2">
              <ToggleRow title="¿Acepta mascotas?" checked={form.mascotas} onChange={(v) => update({ mascotas: v })} />
              <ToggleRow title="Agua incluida" checked={form.agua} onChange={(v) => update({ agua: v })} />
              <ToggleRow title="Internet incluido" checked={form.internet} onChange={(v) => update({ internet: v })} />
              <ToggleRow title="Gas incluido" checked={form.gas} onChange={(v) => update({ gas: v })} />
              <ToggleRow
                title="Mantenimiento incluido"
                checked={form.mantenimiento}
                onChange={(v) => update({ mantenimiento: v })}
              />
            </div>

            <FormField label="Descripción">
              <textarea
                value={form.descripcion}
                onChange={(e) => update({ descripcion: e.target.value })}
                rows={3}
                placeholder="Resumen de la publicación..."
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </FormField>

            <FormField
              label="Fotos adicionales"
              hint="La captura escaneada ya se incluye como primera foto"
            >
              <PhotoPicker photos={extraPhotos} onChange={setExtraPhotos} />
            </FormField>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md">
          {publishError && (
            <div className="mx-auto flex max-w-2xl items-start gap-2 px-4 pt-3 text-destructive sm:px-6">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{publishError}</p>
            </div>
          )}
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              size="lg"
              className="flex-1 gap-1.5"
              onClick={publish}
              disabled={!canPublish || publishing}
            >
              {publishing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              {publishing ? 'Publicando...' : 'Publicar en Renta Segura'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
