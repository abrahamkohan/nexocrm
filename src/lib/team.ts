// src/lib/team.ts
import { supabase } from './supabase'

export type TeamMember = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  role: 'admin' | 'agente' | null
}

export async function getTeam(): Promise<TeamMember[]> {
  const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('user_roles').select('user_id, role'),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const roleMap = Object.fromEntries((roles ?? []).map(r => [r.user_id, r.role]))

  return (profiles ?? []).map(p => ({
    id:         p.id,
    full_name:  p.full_name,
    phone:      p.phone,
    avatar_url: p.avatar_url,
    created_at: p.created_at,
    role:       (roleMap[p.id] as 'admin' | 'agente') ?? null,
  }))
}

export async function setRole(userId: string, role: 'admin' | 'agente'): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function removeRole(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}

export async function inviteUser(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw error
}
