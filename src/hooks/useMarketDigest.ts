import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/context/BrandContext'

export interface MarketDigest {
  id: string
  created_at: string
  fecha: string
  summary: string | null
  titulares: { titulo: string; url: string; fuente: string }[]
  senal_inversor: string | null
  status: string
  quality: string
}

export interface DigestHistoryItem {
  id: string
  fecha: string
  status: string
  quality: string
  summary: string | null
}

// Queries por defecto
const DEFAULT_QUERIES = [
  'mercado inmobiliario Paraguay 2026',
  'real estate Paraguay inversión',
  'precios propiedades Asunción Paraguay',
]

export function useMarketDigest() {
  const { consultant } = useBrand()
  const queryClient = useQueryClient()
  const consultantId = consultant.uuid
  const today = new Date().toISOString().split('T')[0]
  
  // Estado para fecha seleccionada (default: hoy)
  const [selectedDate, setSelectedDate] = useState<string>(today)
  
  // Estado para queries personalizadas
  const [customQueries, setCustomQueries] = useState<string[]>(DEFAULT_QUERIES)
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])

  // Cargar queries guardadas de localStorage
  useEffect(() => {
    if (consultantId) {
      const saved = localStorage.getItem(`market-queries-${consultantId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomQueries(parsed)
          }
        } catch {
          // Ignorar error de parseo
        }
      }
    }
  }, [consultantId])

  // Guardar queries en localStorage
  const saveQueries = (queries: string[]) => {
    setCustomQueries(queries)
    if (consultantId) {
      localStorage.setItem(`market-queries-${consultantId}`, JSON.stringify(queries))
    }
  }

  // Query para el digest activo (fecha seleccionada)
  const query = useQuery({
    queryKey: ['market-digest', consultantId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_digests')
        .select('*')
        .eq('consultant_id', consultantId)
        .eq('fecha', selectedDate)
        .maybeSingle()

      if (error) throw error
      return data as MarketDigest | null
    },
    enabled: !!consultantId,
  })

  // Query para histórico (últimos 7 días)
  const historyQuery = useQuery({
    queryKey: ['market-digest-history', consultantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_digests')
        .select('id, fecha, status, quality, summary')
        .eq('consultant_id', consultantId)
        .order('fecha', { ascending: false })
        .limit(7)

      if (error) throw error
      return data as DigestHistoryItem[]
    },
    enabled: !!consultantId,
  })

  // Mutation para generar nuevo digest
  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'market-digest',
        {
          body: {
            consultant_id: consultantId,
            queries: customQueries,
            pais: 'Paraguay',
          },
        }
      )
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      return data.data
    },
    onSuccess: () => {
      // Invalidar tanto el digest actual como el histórico
      queryClient.invalidateQueries({
        queryKey: ['market-digest', consultantId, today],
      })
      queryClient.invalidateQueries({
        queryKey: ['market-digest-history', consultantId],
      })
    },
  })

  // Mutation para publicar
  const publishMutation = useMutation({
    mutationFn: async (digestId: string) => {
      const { error } = await (supabase as any)
        .from('market_digests')
        .update({ status: 'published' })
        .eq('id', digestId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['market-digest', consultantId, selectedDate],
      })
      queryClient.invalidateQueries({
        queryKey: ['market-digest-history', consultantId],
      })
    },
  })

  // Mutation para sugerir queries con IA
  const suggestMutation = useMutation({
    mutationFn: async (idea: string) => {
      try {
        // Intentar llamar a la Edge Function sin autenticación (no-verify-jwt)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-queries`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idea,
              pais: 'Paraguay',
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        setSuggestedQueries(data.queries)
        return data.queries as string[]
      } catch (err) {
        // Fallback: generar queries localmente basadas en la idea
        const fallbackQueries = generateLocalQueries(idea)
        setSuggestedQueries(fallbackQueries)
        return fallbackQueries
      }
    },
  })

  // Función local para generar queries cuando la API falla
  function generateLocalQueries(idea: string): string[] {
    const keywords = idea.toLowerCase().split(' ').filter(w => w.length > 3)
    const baseQuery = keywords.slice(0, 3).join(' ')
    
    return [
      `${baseQuery} Paraguay 2026`,
      `${baseQuery} mercado inmobiliario`,
      `${baseQuery} inversión`,
      `${baseQuery} tendencias 2026`,
      `${baseQuery} precios`,
    ].slice(0, 5)
  }

  // Función para seleccionar fecha
  const selectDate = (date: string) => {
    setSelectedDate(date)
  }

  // Función para aceptar queries sugeridas
  const acceptSuggestedQueries = (queries: string[]) => {
    saveQueries(queries)
    setSuggestedQueries([])
  }

  // Función para rechazar sugerencias
  const clearSuggestions = () => {
    setSuggestedQueries([])
  }

  // Verificar si es hoy
  const isToday = selectedDate === today

  return {
    // Digest actual
    query,
    digest: query.data,
    isLoading: query.isLoading,
    
    // Histórico
    historyQuery,
    history: historyQuery.data || [],
    
    // Fecha seleccionada
    selectedDate,
    isToday,
    selectDate,
    
    // Queries
    customQueries,
    suggestedQueries,
    saveQueries,
    
    // Mutations
    mutation,
    publishMutation,
    suggestMutation,
    acceptSuggestedQueries,
    clearSuggestions,
  }
}
