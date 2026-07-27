'use client'

import { useEffect, useState } from 'react'

export type PropertyStatus = 'Disponible' | 'En Trato' | 'Rentado'

export interface Property {
  id: string
  image: string
  price: number
  title: string
  location: string
  zone: string
  tags: string[]
  whatsapp: string
  status: PropertyStatus
  createdAt: string
  propertyType?: string
  deposit?: number
  contractDuration?: string
  bedrooms?: number
  bathrooms?: number
  parking?: string
  coolingType?: string
  coolingUnits?: string
  electricityRate?: string
  petsPolicy?: string
  description?: string
}

export interface Demand {
  id: string
  name: string
  anonymous?: boolean
  message: string
  budget: string
  zone: string
  tenants: string
  postedAt: string
  createdAt: string
}

export type NewProperty = Omit<Property, 'id' | 'status' | 'createdAt'> & {
  status?: PropertyStatus
}

export type NewDemand = Omit<Demand, 'id' | 'postedAt' | 'createdAt'>

const PROPERTIES_KEY = 'renta-segura:properties'
const DEMANDS_KEY = 'renta-segura:demands'

const seedProperties: Property[] = [
  {
    id: 'p1',
    image: '/images/depto-uabc.png',
    price: 6500,
    title: 'Departamento 2 Recámaras a 5 min de UABC Central',
    location: 'Fracc. Villafontana, cerca de UABC',
    zone: 'UABC Central',
    tags: ['2 Minisplits', 'Servicios Incluidos', 'Acepta Mascotas'],
    whatsapp: '526861234567',
    status: 'Disponible',
    createdAt: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'p2',
    image: '/images/casa-prohogar.png',
    price: 8900,
    title: 'Casa 3 Recámaras con cochera en Prohogar',
    location: 'Col. Pro Hogar, Mexicali',
    zone: 'Prohogar',
    tags: ['3 Recámaras', 'Cochera Techada', 'Patio Amplio'],
    whatsapp: '526862345678',
    status: 'En Trato',
    createdAt: '2026-06-05T12:00:00.000Z',
  },
  {
    id: 'p3',
    image: '/images/studio-palaco.png',
    price: 4800,
    title: 'Studio amueblado ideal para 1 persona en Palaco',
    location: 'Zona Palaco, Mexicali',
    zone: 'Palaco',
    tags: ['Amueblado', '1 Minisplit', 'Wifi Incluido'],
    whatsapp: '526863456789',
    status: 'Rentado',
    createdAt: '2026-06-10T12:00:00.000Z',
  },
]

const seedDemands: Demand[] = [
  {
    id: 'd1',
    name: 'Carlos M.',
    message:
      'Busco departamento de 4,000 a 6,000 por la Zona Industrial. Somos pareja sin niños, ambos trabajamos y tenemos comprobante de ingresos.',
    budget: '$6k max',
    zone: 'Industrial',
    tenants: '2',
    postedAt: 'Hace 2 horas',
    createdAt: '2026-07-25T10:00:00.000Z',
  },
  {
    id: 'd2',
    name: 'Usuario Anónimo',
    anonymous: true,
    message:
      'Estudiante de UABC busca cuarto o studio cerca del campus por menos de $3,500. Tranquilo, sin fiestas, pago puntual cada mes.',
    budget: '$3.5k max',
    zone: 'UABC',
    tenants: '1',
    postedAt: 'Hace 5 horas',
    createdAt: '2026-07-25T07:00:00.000Z',
  },
  {
    id: 'd3',
    name: 'Familia Rosales',
    message:
      'Necesitamos casa de 3 recámaras con patio en Prohogar o Nueva. Presupuesto hasta $9,000, tenemos un perro pequeño. Buscamos contrato de un año.',
    budget: '$9k max',
    zone: 'Prohogar',
    tenants: '4',
    postedAt: 'Ayer',
    createdAt: '2026-07-24T12:00:00.000Z',
  },
]

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

type Listener = () => void
const propertyListeners = new Set<Listener>()
const demandListeners = new Set<Listener>()

function notifyProperties() {
  propertyListeners.forEach((listener) => listener())
}

function notifyDemands() {
  demandListeners.forEach((listener) => listener())
}

export function getProperties(): Property[] {
  if (typeof window === 'undefined') return seedProperties
  const raw = window.localStorage.getItem(PROPERTIES_KEY)
  if (!raw) {
    writeStorage(PROPERTIES_KEY, seedProperties)
    return seedProperties
  }
  try {
    return JSON.parse(raw) as Property[]
  } catch {
    return seedProperties
  }
}

export function saveProperty(input: NewProperty): Property {
  const newProperty: Property = {
    ...input,
    id: generateId('p'),
    status: input.status ?? 'Disponible',
    createdAt: new Date().toISOString(),
  }
  writeStorage(PROPERTIES_KEY, [newProperty, ...getProperties()])
  notifyProperties()
  return newProperty
}

export function updatePropertyStatus(id: string, newStatus: PropertyStatus) {
  const updated = getProperties().map((property) =>
    property.id === id ? { ...property, status: newStatus } : property,
  )
  writeStorage(PROPERTIES_KEY, updated)
  notifyProperties()
}

export function deleteProperty(id: string) {
  const updated = getProperties().filter((property) => property.id !== id)
  writeStorage(PROPERTIES_KEY, updated)
  notifyProperties()
}

export function getDemands(): Demand[] {
  if (typeof window === 'undefined') return seedDemands
  const raw = window.localStorage.getItem(DEMANDS_KEY)
  if (!raw) {
    writeStorage(DEMANDS_KEY, seedDemands)
    return seedDemands
  }
  try {
    return JSON.parse(raw) as Demand[]
  } catch {
    return seedDemands
  }
}

export function saveDemand(input: NewDemand): Demand {
  const newDemand: Demand = {
    ...input,
    id: generateId('d'),
    postedAt: 'Hace instantes',
    createdAt: new Date().toISOString(),
  }
  writeStorage(DEMANDS_KEY, [newDemand, ...getDemands()])
  notifyDemands()
  return newDemand
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>(seedProperties)

  useEffect(() => {
    setProperties(getProperties())
    const listener = () => setProperties(getProperties())
    propertyListeners.add(listener)
    return () => {
      propertyListeners.delete(listener)
    }
  }, [])

  return properties
}

export function useDemands() {
  const [demands, setDemands] = useState<Demand[]>(seedDemands)

  useEffect(() => {
    setDemands(getDemands())
    const listener = () => setDemands(getDemands())
    demandListeners.add(listener)
    return () => {
      demandListeners.delete(listener)
    }
  }, [])

  return demands
}
