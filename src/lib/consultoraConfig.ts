// src/lib/consultoraConfig.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']
type ConsultoraUpdate = Database['public']['Tables']['consultora_config']['Update']

const ROW_ID = 1

export async function getConsultoraConfig(): Promise<ConsultoraRow | null> {
  const { data, error } = await supabase
    .from('consultora_config')
    .select('*')
    .eq('id', ROW_ID)
    .maybeSingle()
  if (error) throw error
  return data as ConsultoraRow | null
}

export async function upsertConsultoraConfig(values: ConsultoraUpdate & { nombre: string }): Promise<ConsultoraRow> {
  // Use upsert without .single() to avoid RLS SELECT failures after write
  const { error } = await supabase
    .from('consultora_config')
    .upsert({ id: ROW_ID, ...values }, { onConflict: 'id' })
  if (error) throw error
  // Return an optimistic row — React Query will refetch the real data via invalidateQueries
  return { id: ROW_ID, updated_at: new Date().toISOString(), ...values } as ConsultoraRow
}
