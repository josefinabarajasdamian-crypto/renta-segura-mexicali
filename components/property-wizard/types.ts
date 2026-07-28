export type PetsPolicy = 'No acepta' | 'Solo gato' | 'Perro chico' | 'Cualquier mascota'

export type PropertyFormData = {
  // Paso 1: Ubicación y Precio
  photos: File[]
  propertyType: string
  zone: string
  rentPrice: string
  deposit: string
  contractDuration: string
  // Paso 2: Clima y Equipamiento
  coolingType: string
  coolingUnits: string
  electricityRate: string
  bedrooms: number
  bathrooms: number
  parking: string
  // Paso 3: Reglas y Servicios
  servicesIncluded: {
    water: boolean
    internet: boolean
    gas: boolean
    maintenance: boolean
  }
  petsPolicy: PetsPolicy
  familiesAllowed: boolean
  incomeProofRequired: boolean
  guarantorRequired: boolean
}

export const defaultFormData: PropertyFormData = {
  photos: [],
  propertyType: '',
  zone: '',
  rentPrice: '',
  deposit: '',
  contractDuration: '',
  coolingType: '',
  coolingUnits: '',
  electricityRate: '',
  bedrooms: 1,
  bathrooms: 1,
  parking: '',
  servicesIncluded: {
    water: false,
    internet: false,
    gas: false,
    maintenance: false,
  },
  petsPolicy: 'No acepta',
  familiesAllowed: true,
  incomeProofRequired: true,
  guarantorRequired: false,
}

export const wizardSteps = [
  { id: 1, label: 'Ubicación y Precio' },
  { id: 2, label: 'Clima y Equipamiento' },
  { id: 3, label: 'Reglas y Servicios' },
  { id: 4, label: 'Vista Previa y Ficha' },
] as const
