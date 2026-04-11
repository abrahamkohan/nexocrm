import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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

export function useMarketDigest() {
  const { consultant } = useBrand()
  const queryClient = useQueryClient()
  const consultantId = consultant.uuid
  const today = new Date().toISOString().split('T')[0]
  
  // Estado para fecha seleccionada (default: hoy)
  const [selectedDate, setSelectedDate] = useState<string>(today)

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
            queries: [
              'mercado inmobiliario Paraguay 2026',
              'real estate Paraguay inversión',
              'precios propiedades Asunción Paraguay',
            ],
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

  // Función para seleccionar fecha
  const selectDate = (date: string) => {
    setSelectedDate(date)
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
    
    // Mutations
    mutation,
    publishMutation,
  }
}
