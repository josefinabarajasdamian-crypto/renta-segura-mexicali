import { FormField } from './form-field'
import { ChipRadioGroup } from './chip-radio-group'
import { ToggleRow } from './toggle-switch'
import type { PetsPolicy, PropertyFormData } from './types'

const petsOptions: PetsPolicy[] = ['No acepta', 'Solo gato', 'Perro chico', 'Cualquier mascota']

export function StepRules({
  data,
  update,
}: {
  data: PropertyFormData
  update: (patch: Partial<PropertyFormData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground">Servicios Incluidos</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow
            title="Agua"
            checked={data.servicesIncluded.water}
            onChange={(v) => update({ servicesIncluded: { ...data.servicesIncluded, water: v } })}
          />
          <ToggleRow
            title="Internet"
            checked={data.servicesIncluded.internet}
            onChange={(v) =>
              update({ servicesIncluded: { ...data.servicesIncluded, internet: v } })
            }
          />
          <ToggleRow
            title="Gas"
            checked={data.servicesIncluded.gas}
            onChange={(v) => update({ servicesIncluded: { ...data.servicesIncluded, gas: v } })}
          />
          <ToggleRow
            title="Cuota de Mantenimiento"
            checked={data.servicesIncluded.maintenance}
            onChange={(v) =>
              update({ servicesIncluded: { ...data.servicesIncluded, maintenance: v } })
            }
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground">Reglas del Hogar</h3>
        <div className="space-y-4">
          <FormField label="¿Acepta mascotas?">
            <ChipRadioGroup
              name="¿Acepta mascotas?"
              value={data.petsPolicy}
              onChange={(v) => update({ petsPolicy: v as PetsPolicy })}
              options={petsOptions}
            />
          </FormField>

          <div className="space-y-2">
            <ToggleRow
              title="¿Acepta niños / familias?"
              checked={data.familiesAllowed}
              onChange={(v) => update({ familiesAllowed: v })}
            />
            <ToggleRow
              title="¿Comprobante de ingresos obligatorio?"
              checked={data.incomeProofRequired}
              onChange={(v) => update({ incomeProofRequired: v })}
            />
            <ToggleRow
              title="¿Requiere Aval / Fianza?"
              checked={data.guarantorRequired}
              onChange={(v) => update({ guarantorRequired: v })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
