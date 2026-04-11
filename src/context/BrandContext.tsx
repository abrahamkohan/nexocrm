// src/context/BrandContext.tsx
// Provee brand engine a todos los componentes CRM (auth'd).
// Usa consultant_id de user_roles como fuente de verdad para branding.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useHost } from './HostContext'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { loadBrand, clearBrandCache } from '@/lib/brandLoader'
import { BrandEngine } from '@/lib/brand/BrandEngine'
import type { Consultant } from '@/types/consultant'
import { DEFAULT_CONSULTANT } from '@/types/consultant'

interface BrandContextValue {
  engine: BrandEngine
  consultant: Consultant
  nombre: string
  isLoading: boolean
  notFound: boolean
  isDefault: boolean
}

const BrandCtx = createContext<BrandContextValue | null>(null)

function isLight(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { hostname, subdomain } = useHost()
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<Consultant>(DEFAULT_CONSULTANT)
  const [notFound, setNotFound] = useState(false)
  const [isDefault, setIsDefault] = useState(true)

  // Cargar consultant cuando cambia hostname/subdomain o cuando cambia la sesión
  useEffect(() => {
    let cancelled = false

    async function loadConsultant() {
      setLoading(true)

      // Obtener consultant_id desde user_roles (fuente de verdad)
      let consultantId: string | null = null
      
      if (session?.user?.id) {
        const { data } = await supabase
          .from('user_roles')
          .select('consultant_id')
          .eq('user_id', session.user.id as unknown as never)
          .maybeSingle() as { data: { consultant_id: string | null } | null }
        
        consultantId = data?.consultant_id ?? null
      }

      let result: { consultant: Consultant; isDefault: boolean; notFound: boolean }
      try {
        result = await loadBrand(hostname, subdomain, consultantId)
      } catch (err) {
        console.error('[BrandContext] loadBrand threw:', err)
        result = { consultant: DEFAULT_CONSULTANT, isDefault: true, notFound: false }
      }

      if (!cancelled) {
        setConsultant(result.consultant)
        setNotFound(result.notFound)
        setIsDefault(result.isDefault)
        setLoading(false)
      }
    }

    loadConsultant()

    return () => {
      cancelled = true
    }
  }, [hostname, subdomain, session])

  // Crear engine con settings del consultant
  const engine = useMemo(() => {
    const settings = {
      nombre: consultant.nombre,
      logo_url: consultant.logo_url,
      logo_light_url: consultant.logo_light_url,
      color_primary: consultant.color_primary,
      color_secondary: consultant.color_secondary,
      color_accent: consultant.color_accent,
      version: 1,
    }
    return new BrandEngine(settings)
  }, [consultant])

  // Aplicar colores como CSS variables en :root
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-primary', consultant.color_primary)
    root.style.setProperty('--brand-secondary', consultant.color_secondary)
    root.style.setProperty('--brand-accent', consultant.color_accent)
    root.style.setProperty('--brand-nombre', consultant.nombre)
    // Conectar sidebar al color secundario con texto contrastante automático
    root.style.setProperty('--sidebar', consultant.color_secondary)
    root.style.setProperty('--sidebar-foreground', isLight(consultant.color_secondary) ? '#111111' : '#ffffff')
    root.style.setProperty('--sidebar-accent', consultant.color_accent)
    root.style.setProperty('--sidebar-accent-foreground', isLight(consultant.color_accent) ? '#111111' : '#ffffff')
    if (consultant.logo_url) {
      root.style.setProperty('--brand-logo', consultant.logo_url)
    }
    if (consultant.logo_light_url) {
      root.style.setProperty('--brand-logo-light', consultant.logo_light_url)
    }
  }, [consultant])

  const value = useMemo<BrandContextValue>(() => ({
    engine,
    consultant,
    nombre: consultant.nombre,
    isLoading: loading,
    notFound,
    isDefault,
  }), [engine, consultant, loading, notFound, isDefault])

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandCtx)
  if (!ctx) throw new Error('useBrand must be used inside <BrandProvider>')
  return ctx
}

/**
 * Hook para limpiar el caché de brand (útil en logout)
 */
export function useClearBrandCache() {
  return clearBrandCache
}