// src/lib/commissions.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type CommissionRow = Database['public']['Tables']['commissions']['Row']
type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
type CommissionUpdate = Database['public']['Tables']['commissions']['Update']
type IncomeRow = Database['public']['Tables']['commission_incomes']['Row']
type IncomeInsert = Database['public']['Tables']['commission_incomes']['Insert']
type ClientLinkRow = Database['public']['Tables']['commission_clients']['Row']

// Tipo extendido con relaciones embebidas
export type CommissionFull = CommissionRow & {
  commission_incomes: IncomeRow[]
  commission_clients: (ClientLinkRow & {
    clients: { id: string; full_name: string; phone: string | null }
  })[]
}

const SELECT_FULL = `
  *,
  commission_incomes(*),
  commission_clients(*, clients(id, full_name, phone))
`

// ─── Comisiones ───────────────────────────────────────────────────────────────

export async function getCommissions(): Promise<CommissionFull[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select(SELECT_FULL)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as CommissionFull[]
}

export async function getCommissionById(id: string): Promise<CommissionFull> {
  const { data, error } = await supabase
    .from('commissions')
    .select(SELECT_FULL)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as CommissionFull
}

export async function createCommission(input: CommissionInsert): Promise<CommissionRow> {
  const { data, error } = await supabase
    .from('commissions')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as CommissionRow
}

export async function updateCommission(id: string, input: CommissionUpdate): Promise<CommissionRow> {
  const { data, error } = await supabase
    .from('commissions')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as CommissionRow
}

export async function deleteCommission(id: string): Promise<void> {
  const { error } = await supabase
    .from('commissions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Clientes vinculados ──────────────────────────────────────────────────────

export async function addCommissionClient(
  commissionId: string,
  clientId: string,
  tipo: 'vendedor' | 'comprador'
): Promise<ClientLinkRow> {
  const { data, error } = await supabase
    .from('commission_clients')
    .insert({ commission_id: commissionId, client_id: clientId, tipo })
    .select()
    .single()
  if (error) throw error
  return data as unknown as ClientLinkRow
}

export async function removeCommissionClient(commissionId: string, clientId: string): Promise<void> {
  const { error } = await supabase
    .from('commission_clients')
    .delete()
    .eq('commission_id', commissionId)
    .eq('client_id', clientId)
  if (error) throw error
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────

export async function createIncome(input: IncomeInsert): Promise<IncomeRow> {
  const { data, error } = await supabase
    .from('commission_incomes')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as IncomeRow
}

export async function updateIncome(id: string, input: Partial<IncomeInsert>): Promise<IncomeRow> {
  const { data, error } = await supabase
    .from('commission_incomes')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as IncomeRow
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase
    .from('commission_incomes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Helper calculado (client-side, sin query) ────────────────────────────────

export function calcTotals(c: CommissionFull) {
  const totalCobrado    = c.commission_incomes.reduce((sum, i) => sum + i.monto_ingresado, 0)
  const saldoPendiente  = c.importe_comision - totalCobrado
  const estado: '🟢' | '🔴' = saldoPendiente <= 0 ? '🟢' : '🔴'
  return { totalCobrado, saldoPendiente, estado }
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}
