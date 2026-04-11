// src/lib/typologies.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type TypologyRow = Database['public']['Tables']['typologies']['Row']
type TypologyInsert = Database['public']['Tables']['typologies']['Insert']
type TypologyUpdate = Database['public']['Tables']['typologies']['Update']

export async function getTypologies(projectId: string): Promise<TypologyRow[]> {
  const { data, error } = await supabase
    .from('typologies')
    .select('*')
    .eq('project_id', projectId as any)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as unknown as TypologyRow[]
}

export async function createTypology(input: TypologyInsert): Promise<TypologyRow> {
  console.log('typologies.ts createTypology START', input)
  const { data, error } = await supabase
    .from('typologies')
    .insert(input as any)
    .select()
    .single()
  console.log('typologies.ts createTypology response:', { data, error })
  if (error) {
    console.error('typologies.ts error:', error)
    throw error
  }
  return data as unknown as TypologyRow
}

export async function updateTypology(id: string, input: TypologyUpdate): Promise<TypologyRow> {
  const { data, error } = await supabase
    .from('typologies')
    .update(input as any)
    .eq('id', id as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as TypologyRow
}

export async function deleteTypology(id: string): Promise<void> {
  const { error } = await supabase
    .from('typologies')
    .delete()
    .eq('id', id as any)
  if (error) throw error
}
