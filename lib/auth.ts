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
