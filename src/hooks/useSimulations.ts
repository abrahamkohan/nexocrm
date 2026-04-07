// src/hooks/useSimulations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllSimulations, getSimulationById, getSimulationsByClient, createSimulation, deleteSimulation, updateSimulation, updateSimulationReportPath } from '@/lib/simulations'
import { generateAndUploadReport } from '@/lib/pdfService'
import type { Database } from '@/types/database'

type SimRow = Database['public']['Tables']['simulations']['Row']
type SimInsert = Database['public']['Tables']['simulations']['Insert']

export function useAllSimulations() {
  return useQuery({
    queryKey: ['simulations_all'],
    queryFn: getAllSimulations,
  })
}

export function useSimulation(id: string) {
  return useQuery({
    queryKey: ['simulation', id],
    queryFn: () => getSimulationById(id),
    enabled: !!id,
  })
}

export function useSimulationsByClient(clientId: string) {
  return useQuery({
    queryKey: ['simulations', clientId],
    queryFn: () => getSimulationsByClient(clientId),
    enabled: !!clientId,
  })
}

export function useSaveSimulation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SimInsert) => createSimulation(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['simulations', data.client_id] })
    },
  })
}

export function useUpdateSimulation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Database['public']['Tables']['simulations']['Update'] }) =>
      updateSimulation(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulations_all'] })
    },
  })
}

export function useDeleteSimulation(clientId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSimulation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulations_all'] })
      if (clientId) qc.invalidateQueries({ queryKey: ['simulations', clientId] })
    },
  })
}

export function useGenerateReport(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sim, clientName }: { sim: SimRow; clientName: string }) => {
      const path = await generateAndUploadReport(sim, clientName)
      await updateSimulationReportPath(sim.id, path)
      return path
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulations', clientId] }),
  })
}
