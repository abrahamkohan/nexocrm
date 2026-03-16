// src/hooks/useFinancingPlans.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFinancingPlans, createFinancingPlan,
  updateFinancingPlan, deleteFinancingPlan,
} from '@/lib/financingPlans'
import type { Database } from '@/types/database'

type PlanInsert = Database['public']['Tables']['financing_plans']['Insert']
type PlanUpdate = Database['public']['Tables']['financing_plans']['Update']

export function useFinancingPlans(projectId: string) {
  return useQuery({
    queryKey: ['financing_plans', projectId],
    queryFn: () => getFinancingPlans(projectId),
    enabled: !!projectId,
  })
}

export function useCreateFinancingPlan(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PlanInsert) => createFinancingPlan(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['financing_plans', projectId] }),
  })
}

export function useUpdateFinancingPlan(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PlanUpdate }) =>
      updateFinancingPlan(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['financing_plans', projectId] }),
  })
}

export function useDeleteFinancingPlan(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFinancingPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['financing_plans', projectId] }),
  })
}
