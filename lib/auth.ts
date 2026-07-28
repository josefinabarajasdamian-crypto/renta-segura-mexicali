'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { SupabaseNotConfiguredError } from '@/lib/store'

export type UserRole = 'propietario' | 'agente' | 'inquilino'

export interface Profile {
  id: string
  fullName: string | null
  phone: string | null
  role: UserRole
  isVerified: boolean
}

interface ProfileRow {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  is_verified: boolean
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    isVerified: row.is_verified,
  }
}

function requireClient() {
  if (!supabase) throw new SupabaseNotConfiguredError()
  return supabase
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const client = requireClient()
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? rowToProfile(data as ProfileRow) : null
}

export interface PublicProfile {
  id: string
  fullName: string | null
  role: UserRole
  isVerified: boolean
}

interface PublicProfileRow {
  id: string
  full_name: string | null
  role: UserRole
  is_verified: boolean
}

function rowToPublicProfile(row: PublicProfileRow): PublicProfile {
  return { id: row.id, fullName: row.full_name, role: row.role, isVerified: row.is_verified }
}

// Perfil público de cualquier usuario (nombre, rol, verificado) — sin
// teléfono ni datos privados. No requiere sesión iniciada.
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles_public')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? rowToPublicProfile(data as PublicProfileRow) : null
}

export async function getPublicProfiles(userIds: string[]): Promise<Record<string, PublicProfile>> {
  if (userIds.length === 0) return {}
  const client = requireClient()
  const { data, error } = await client.from('profiles_public').select('*').in('id', userIds)
  if (error) throw error
  const map: Record<string, PublicProfile> = {}
  for (const row of (data as PublicProfileRow[]) ?? []) {
    map[row.id] = rowToPublicProfile(row)
  }
  return map
}

export function usePublicProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    getPublicProfile(userId)
      .then((p) => {
        if (active) {
          setProfile(p)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) setError(err as Error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  return { profile, loading, error }
}

export function usePublicProfiles(userIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({})
  const key = [...new Set(userIds)].sort().join(',')

  useEffect(() => {
    if (!isSupabaseConfigured || !key) return
    let active = true
    getPublicProfiles(key.split(','))
      .then((map) => {
        if (active) setProfiles(map)
      })
      .catch(() => {
        if (active) setProfiles({})
      })
    return () => {
      active = false
    }
  }, [key])

  return profiles
}

export async function signUp(input: {
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
}) {
  const client = requireClient()
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName, phone: input.phone, role: input.role },
      emailRedirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  })
  if (error) throw error
  return data
}

export async function signIn(input: { email: string; password: string }) {
  const client = requireClient()
  const { data, error } = await client.auth.signInWithPassword(input)
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    let active = true

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (active) setProfile(null)
        return
      }
      try {
        const p = await getProfile(currentUser.id)
        if (active) setProfile(p)
      } catch {
        if (active) setProfile(null)
      }
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      setUser(data.user)
      await loadProfile(data.user)
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading }
}
