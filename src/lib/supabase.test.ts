import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('Supabase client singleton', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('exposes a .from() method for querying tables', () => {
    expect(typeof supabase.from).toBe('function')
    const builder = supabase.from('projects')
    expect(typeof builder.select).toBe('function')
  })
})
