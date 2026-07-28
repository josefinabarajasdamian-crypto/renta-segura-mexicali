'use client'

import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type PropertyStatus = 'Disponible' | 'En Trato' | 'Rentado'

export interface Property {
  id: string
  images: string[]
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
  createdAt: string
}

export type NewProperty = Omit<Property, 'id' | 'status' | 'createdAt'> & {
  status?: PropertyStatus
}

export type NewDemand = Omit<Demand, 'id' | 'createdAt'>

interface PropertyRow {
  id: string
  image: string
  images: string[] | null
  price: number
  title: string
  location: string
  zone: string
  tags: string[]
  whatsapp: string
  status: PropertyStatus
  created_at: string
  property_type: string | null
  deposit: number | null
  contract_duration: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: string | null
  cooling_type: string | null
  cooling_units: string | null
  electricity_rate: string | null
  pets_policy: string | null
  description: string | null
}

interface DemandRow {
  id: string
  name: string
  anonymous: boolean
  message: string
  budget: string
  zone: string
  tenants: string
  created_at: string
}

function rowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    images: row.images && row.images.length > 0 ? row.images : row.image ? [row.image] : [],
    price: row.price,
    title: row.title,
    location: row.location,
    zone: row.zone,
    tags: row.tags ?? [],
    whatsapp: row.whatsapp,
    status: row.status,
    createdAt: row.created_at,
    propertyType: row.property_type ?? undefined,
    deposit: row.deposit ?? undefined,
    contractDuration: row.contract_duration ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    parking: row.parking ?? undefined,
    coolingType: row.cooling_type ?? undefined,
    coolingUnits: row.cooling_units ?? undefined,
    electricityRate: row.electricity_rate ?? undefined,
    petsPolicy: row.pets_policy ?? undefined,
    description: row.description ?? undefined,
  }
}

function propertyToRow(input: NewProperty) {
  return {
    image: input.images[0] ?? '',
    images: input.images,
    price: input.price,
    title: input.title,
    location: input.location,
    zone: input.zone,
    tags: input.tags,
    whatsapp: input.whatsapp,
    status: input.status ?? 'Disponible',
    property_type: input.propertyType ?? null,
    deposit: input.deposit ?? null,
    contract_duration: input.contractDuration ?? null,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    parking: input.parking ?? null,
    cooling_type: input.coolingType ?? null,
    cooling_units: input.coolingUnits ?? null,
    electricity_rate: input.electricityRate ?? null,
    pets_policy: input.petsPolicy ?? null,
    description: input.description ?? null,
  }
}

function rowToDemand(row: DemandRow): Demand {
  return {
    id: row.id,
    name: row.name,
    anonymous: row.anonymous,
    message: row.message,
    budget: row.budget,
    zone: row.zone,
    tenants: row.tenants,
    createdAt: row.created_at,
  }
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno.',
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}

function requireClient() {
  if (!supabase) throw new SupabaseNotConfiguredError()
  return supabase
}

export async function getProperties(): Promise<Property[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as PropertyRow[]).map(rowToProperty)
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const client = requireClient()
  const { data, error } = await client.from('properties').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? rowToProperty(data as PropertyRow) : null
}

export async function saveProperty(input: NewProperty): Promise<Property> {
  const client = requireClient()
  const { data, error } = await client
    .from('properties')
    .insert(propertyToRow(input))
    .select()
    .single()
  if (error) throw error
  return rowToProperty(data as PropertyRow)
}

export async function updatePropertyStatus(id: string, newStatus: PropertyStatus): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('properties').update({ status: newStatus }).eq('id', id)
  if (error) throw error
}

export async function deleteProperty(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('properties').delete().eq('id', id)
  if (error) throw error
}

export async function getDemands(): Promise<Demand[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('demands')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DemandRow[]).map(rowToDemand)
}

export async function saveDemand(input: NewDemand): Promise<Demand> {
  const client = requireClient()
  const { data, error } = await client
    .from('demands')
    .insert({
      name: input.name,
      anonymous: input.anonymous ?? false,
      message: input.message,
      budget: input.budget,
      zone: input.zone,
      tenants: input.tenants,
    })
    .select()
    .single()
  if (error) throw error
  return rowToDemand(data as DemandRow)
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Hace instantes'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError(new SupabaseNotConfiguredError())
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      try {
        const data = await getProperties()
        if (active) {
          setProperties(data)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err as Error)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel('properties-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, load)
      .subscribe()

    return () => {
      active = false
      supabase?.removeChannel(channel)
    }
  }, [])

  return { properties, loading, error }
}

export function useDemands() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError(new SupabaseNotConfiguredError())
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      try {
        const data = await getDemands()
        if (active) {
          setDemands(data)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err as Error)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel('demands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, load)
      .subscribe()

    return () => {
      active = false
      supabase?.removeChannel(channel)
    }
  }, [])

  return { demands, loading, error }
}
