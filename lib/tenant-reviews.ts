'use client'

import { supabase } from '@/lib/supabase'
import { SupabaseNotConfiguredError } from '@/lib/store'

export interface TenantReview {
  id: string
  tenantIdentifier: string
  rating: number
  comment: string | null
  contractEnded: boolean
  createdAt: string
}

interface TenantReviewRow {
  id: string
  tenant_identifier: string
  rating: number
  comment: string | null
  contract_ended: boolean
  created_at: string
}

function rowToTenantReview(row: TenantReviewRow): TenantReview {
  return {
    id: row.id,
    tenantIdentifier: row.tenant_identifier,
    rating: row.rating,
    comment: row.comment,
    contractEnded: row.contract_ended,
    createdAt: row.created_at,
  }
}

function requireClient() {
  if (!supabase) throw new SupabaseNotConfiguredError()
  return supabase
}

// Búsqueda por texto simple contra lo que haya escrito quien calificó —
// no hay verificación de identidad (CURP no está validado), así que dos
// personas con nombres parecidos pueden mezclarse. Es un punto de partida,
// no una fuente de verdad.
export async function searchTenantReviews(query: string): Promise<TenantReview[]> {
  const client = requireClient()
  const trimmed = query.trim()
  if (!trimmed) return []
  const { data, error } = await client
    .from('tenant_reviews')
    .select('*')
    .ilike('tenant_identifier', `%${trimmed}%`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as TenantReviewRow[]).map(rowToTenantReview)
}

export async function submitTenantReview(input: {
  tenantIdentifier: string
  rating: number
  comment: string
  contractEnded: boolean
}): Promise<void> {
  const client = requireClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para calificar a un inquilino.')

  const { error } = await client.from('tenant_reviews').insert({
    tenant_identifier: input.tenantIdentifier.trim(),
    rating: input.rating,
    comment: input.comment.trim() || null,
    contract_ended: input.contractEnded,
    reviewer_id: user.id,
  })
  if (error) throw error
}
