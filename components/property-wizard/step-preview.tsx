'use client'

import { useEffect, useState } from 'react'
import { BedDouble, Bath, Car, Snowflake, Zap, MapPin, CircleCheck, ImageOff } from 'lucide-react'
import type { PropertyFormData } from './types'

function formatPrice(value: string) {
  const num = Number(value)
  if (!num) return '—'
  return `$${num.toLocaleString('es-MX')} MXN`
}

export function StepPreview({ data }: { data: PropertyFormData }) {
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = data.photos.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [data.photos])

  const includedServices = Object.entries({
    Agua: data.servicesIncluded.water,
    Internet: data.servicesIncluded.internet,
    Gas: data.servicesIncluded.gas,
    Mantenimiento: data.servicesIncluded.maintenance,
  })
    .filter(([, included]) => included)
    .map(([label]) => label)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Así se verá tu ficha para los inquilinos interesados. Revisa los datos antes de publicar.
      </p>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {previews.length > 0 ? (
          <div className="grid grid-cols-4 gap-1 p-1">
            {previews.slice(0, 4).map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`Foto ${i + 1}`}
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 border-b border-dashed border-border p-4 text-xs text-muted-foreground">
            <ImageOff className="size-4" />
            No agregaste fotos todavía (paso 1)
          </div>
        )}
        <div className="border-b border-border bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {data.propertyType || 'Tipo de propiedad'}
          </p>
          <h3 className="mt-1 text-pretty font-display text-lg font-extrabold text-foreground">
            {data.propertyType || 'Nueva propiedad'} en {data.zone || 'Mexicali'}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {data.zone || 'Zona por definir'}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-primary">
              {formatPrice(data.rentPrice)}
            </span>
            <span className="text-xs text-muted-foreground">/ mes</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Depósito {formatPrice(data.deposit)} · Contrato mínimo:{' '}
            {data.contractDuration || 'Por definir'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 p-3 text-center">
            <BedDouble className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{data.bedrooms} Recámaras</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 p-3 text-center">
            <Bath className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{data.bathrooms} Baños</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 p-3 text-center">
            <Snowflake className="size-4 text-primary" />
            <span className="text-pretty text-xs font-semibold text-foreground">
              {data.coolingType || 'Sin datos'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 p-3 text-center">
            <Car className="size-4 text-primary" />
            <span className="text-pretty text-xs font-semibold text-foreground">
              {data.parking || 'Sin datos'}
            </span>
          </div>
        </div>

        <div className="space-y-3 border-t border-border p-5">
          <div className="flex items-start gap-2 text-sm text-foreground/90">
            <Zap className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              {data.electricityRate || 'Tarifa de luz por definir'}
              {data.coolingUnits && ` · ${data.coolingUnits}`}
            </span>
          </div>

          {includedServices.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {includedServices.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[0.7rem] font-medium text-accent"
                >
                  <CircleCheck className="size-3" />
                  {service} incluido
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-full bg-primary/5 px-2.5 py-1 text-[0.7rem] font-medium text-primary">
              Mascotas: {data.petsPolicy}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
              {data.familiesAllowed ? 'Acepta familias' : 'No acepta familias'}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
              {data.incomeProofRequired ? 'Requiere comprobante de ingresos' : 'Sin comprobante obligatorio'}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
              {data.guarantorRequired ? 'Requiere aval / fianza' : 'Sin aval requerido'}
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}
