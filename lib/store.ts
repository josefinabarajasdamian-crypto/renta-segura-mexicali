'use client'

import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type PropertyStatus = 'Disponible' | 'En Trato' | 'Rentado'

export interface Property {
  id: string
  userId?: string
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
  source?: string
  needsReview?: boolean
}

export interface Demand {
  id: string
  userId?: string
  name: string
  anonymous?: boolean
  message: string
  budget: string
  zone: string
  tenants: string
  createdAt: string
  source?: string
  needsReview?: boolean
}

export type NewProperty = Omit<Property, 'id' | 'status' | 'createdAt'> & {
  status?: PropertyStatus
}

export type NewDemand = Omit<Demand, 'id' | 'createdAt'>

interface PropertyRow {
  id: string
  user_id: string | null
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
  source: string | null
  needs_review: boolean | null
}

interface DemandRow {
  id: string
  user_id: string | null
  name: string
  anonymous: boolean
  message: string
  budget: string
  zone: string
  tenants: string
  created_at: string
  source: string | null
  needs_review: boolean | null
}

function rowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
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
    source: row.source ?? undefined,
    needsReview: row.needs_review ?? undefined,
  }
}

function propertyToRow(input: NewProperty) {
  return {
    user_id: input.userId ?? null,
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
    userId: row.user_id ?? undefined,
    name: row.name,
    anonymous: row.anonymous,
    message: row.message,
    budget: row.budget,
    zone: row.zone,
    tenants: row.tenants,
    createdAt: row.created_at,
    source: row.source ?? undefined,
    needsReview: row.needs_review ?? undefined,
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
    .eq('needs_review', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as PropertyRow[]).map(rowToProperty)
}

export async function getPropertiesByOwner(userId: string): Promise<Property[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('properties')
    .select('*')
    .eq('user_id', userId)
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

// Publicaciones importadas (p. ej. desde Apify/Facebook) que quedaron
// marcadas como needs_review = true, pendientes de revisión manual antes
// de aparecer en el Directorio o el Muro públicos.
export async function getPendingProperties(): Promise<Property[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('properties')
    .select('*')
    .eq('needs_review', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as PropertyRow[]).map(rowToProperty)
}

export async function approveProperty(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('properties').update({ needs_review: false }).eq('id', id)
  if (error) throw error
}

export async function getPendingDemands(): Promise<Demand[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('demands')
    .select('*')
    .eq('needs_review', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DemandRow[]).map(rowToDemand)
}

export async function approveDemand(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('demands').update({ needs_review: false }).eq('id', id)
  if (error) throw error
}

export async function deleteDemand(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('demands').delete().eq('id', id)
  if (error) throw error
}

export async function getDemands(): Promise<Demand[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('demands')
    .select('*')
    .eq('needs_review', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DemandRow[]).map(rowToDemand)
}

export async function saveDemand(input: NewDemand): Promise<Demand> {
  const client = requireClient()
  const { data, error } = await client
    .from('demands')
    .insert({
      user_id: input.userId ?? null,
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

export async function getDemandsByOwner(userId: string): Promise<Demand[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('demands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DemandRow[]).map(rowToDemand)
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

export function useMyProperties(userId: string | null | undefined) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError(new SupabaseNotConfiguredError())
      setLoading(false)
      return
    }
    if (!userId) {
      setProperties([])
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      try {
        const data = await getPropertiesByOwner(userId as string)
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
      .channel(`my-properties-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties', filter: `user_id=eq.${userId}` },
        load,
      )
      .subscribe()

    return () => {
      active = false
      supabase?.removeChannel(channel)
    }
  }, [userId])

  return { properties, loading, error }
}

export function useMyDemands(userId: string | null | undefined) {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError(new SupabaseNotConfiguredError())
      setLoading(false)
      return
    }
    if (!userId) {
      setDemands([])
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      try {
        const data = await getDemandsByOwner(userId as string)
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
      .channel(`my-demands-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demands', filter: `user_id=eq.${userId}` },
        load,
      )
      .subscribe()

    return () => {
      active = false
      supabase?.removeChannel(channel)
    }
  }, [userId])

  return { demands, loading, error }
}

// Publicaciones importadas (Apify/Facebook) pendientes de revisión manual,
// usado en la página de revisión antes de publicarlas en el Directorio o
// el Muro públicos.
export function usePendingReview() {
  const [properties, setProperties] = useState<Property[]>([])
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
        const [p, d] = await Promise.all([getPendingProperties(), getPendingDemands()])
        if (active) {
          setProperties(p)
          setDemands(d)
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
      .channel('pending-review-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, load)
      .subscribe()

    return () => {
      active = false
      supabase?.removeChannel(channel)
    }
  }, [])

  return { properties, demands, loading, error }
}
