import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/context/BrandContext'

export interface MarketDigest {
  id: string
  fecha: string
  summary: string | null
  titulares: { titulo: string; url: string; fuente: string }[]
  senal_inversor: string | null
  status: string
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
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }

      // Usar fetch directamente para mayor control
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-digest`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            consultant_id: consultantId,
            queries: [
              'mercado inmobiliario Paraguay 2026',
              'real estate Paraguay inversión',
              'precios propiedades Asunción Paraguay',
            ],
            pais: 'Paraguay',
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['market-digest', consultantId, today],
      })
    },
  })

  return { query, mutation }
}
