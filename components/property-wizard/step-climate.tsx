import { Snowflake } from 'lucide-react'
import { FormField } from './form-field'
import { SelectInput } from './select-input'
import { ChipRadioGroup } from './chip-radio-group'
import { CounterInput } from './counter-input'
import type { PropertyFormData } from './types'

const coolingTypes = ['Minisplit Inverter', 'Aire Central', 'Paquete', 'Ninguno']
const electricityRates = ['CFE Independiente', 'Cuota fija de luz incluida']
const parkingOptions = ['Sin estacionamiento', '1 cajón abierto', 'Privada con reja/control']

export function StepClimate({
  data,
  update,
}: {
  data: PropertyFormData
  update: (patch: Partial<PropertyFormData>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-3.5 py-2.5 text-accent">
        <Snowflake className="size-4 shrink-0" />
        <p className="text-xs font-semibold">
          Filtro Cachanilla: los inquilinos en Mexicali priorizan el equipo de clima antes que nada.
        </p>
      </div>

      <FormField label="Tipo de Refrigeración">
        <ChipRadioGroup
          name="Tipo de Refrigeración"
          value={data.coolingType}
          onChange={(v) => update({ coolingType: v })}
          options={coolingTypes}
        />
      </FormField>

      <FormField label="Cantidad de Unidades y Toneladas" hint='Ej. "2 unidades de 1.5 toneladas"'>
        <input
          type="text"
          value={data.coolingUnits}
          onChange={(e) => update({ coolingUnits: e.target.value })}
          disabled={data.coolingType === 'Ninguno'}
          placeholder="2 unidades de 1.5 toneladas"
          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2 disabled:opacity-50"
        />
      </FormField>

      <FormField label="Tarifas de Luz">
        <SelectInput
          value={data.electricityRate}
          onChange={(v) => update({ electricityRate: v })}
          placeholder="Selecciona una opción"
          options={electricityRates}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Recámaras">
          <CounterInput
            value={data.bedrooms}
            onChange={(v) => update({ bedrooms: v })}
            min={0}
            max={10}
          />
        </FormField>
        <FormField label="Baños">
          <CounterInput
            value={data.bathrooms}
            onChange={(v) => update({ bathrooms: v })}
            min={0}
            max={10}
          />
        </FormField>
      </div>

      <FormField label="Estacionamiento">
        <SelectInput
          value={data.parking}
          onChange={(v) => update({ parking: v })}
          placeholder="Selecciona una opción"
          options={parkingOptions}
        />
      </FormField>
    </div>
  )
}
