import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useMarketDigest() {
  const { consultant } = useBrand()
  const queryClient = useQueryClient()
  const consultantId = consultant.uuid
  const today = new Date().toISOString().split('T')[0]

  const query = useQuery({
    queryKey: ['market-digest', consultantId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_digests')
        .select('*')
        .eq('consultant_id', consultantId)
        .eq('fecha', today)
        .maybeSingle()

      if (error) throw error
      return data as MarketDigest | null
    },
    enabled: !!consultantId,
  })

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
      queryClient.invalidateQueries({
        queryKey: ['market-digest', consultantId, today],
      })
    },
  })

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
        queryKey: ['market-digest', consultantId, today],
      })
    },
  })

  return { query, mutation, publishMutation }
}
