import { mexicaliZones } from '@/lib/data'
import { FormField } from './form-field'
import { SelectInput } from './select-input'
import { ChipRadioGroup } from './chip-radio-group'
import { PhotoPicker } from './photo-picker'
import type { PropertyFormData } from './types'

const propertyTypes = ['Departamento', 'Casa', 'Cuarto', 'Estudio']
const contractDurations = ['6 meses', '1 año', 'Flexible']

export function StepLocation({
  data,
  update,
}: {
  data: PropertyFormData
  update: (patch: Partial<PropertyFormData>) => void
}) {
  return (
    <div className="space-y-5">
      <FormField label="Fotos de la propiedad" hint="Sube una o varias fotos reales">
        <PhotoPicker photos={data.photos} onChange={(photos) => update({ photos })} />
      </FormField>

      <FormField label="Título o Tipo de Propiedad">
        <SelectInput
          value={data.propertyType}
          onChange={(v) => update({ propertyType: v })}
          placeholder="Selecciona un tipo"
          options={propertyTypes}
        />
      </FormField>

      <FormField
        label="Zona / Fraccionamiento"
        hint="Escribe para buscar entre las zonas de Mexicali"
      >
        <input
          type="text"
          list="mexicali-zonas"
          value={data.zone}
          onChange={(e) => update({ zone: e.target.value })}
          placeholder="Ej. UABC Central, Palaco, Prohogar..."
          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
        />
        <datalist id="mexicali-zonas">
          {mexicaliZones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Renta Mensual (MXN)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              $
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={data.rentPrice}
              onChange={(e) => update({ rentPrice: e.target.value })}
              placeholder="6,500"
              className="h-11 w-full rounded-xl border border-input bg-background pl-8 pr-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>
        </FormField>

        <FormField label="Depósito (MXN)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              $
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={data.deposit}
              onChange={(e) => update({ deposit: e.target.value })}
              placeholder="6,500"
              className="h-11 w-full rounded-xl border border-input bg-background pl-8 pr-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>
        </FormField>
      </div>

      <FormField label="Duración mínima de contrato">
        <ChipRadioGroup
          name="Duración mínima de contrato"
          value={data.contractDuration}
          onChange={(v) => update({ contractDuration: v })}
          options={contractDurations}
        />
      </FormField>
    </div>
  )
}
