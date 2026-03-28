// src/hooks/useCommissions.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCommissions,
  getCommissionById,
  createCommission,
  updateCommission,
  deleteCommission,
  addCommissionClient,
  removeCommissionClient,
  createIncome,
  updateIncome,
  deleteIncome,
} from '@/lib/commissions'
import type { Database } from '@/types/database'

type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
type CommissionUpdate = Database['public']['Tables']['commissions']['Update']
type IncomeInsert = Database['public']['Tables']['commission_incomes']['Insert']

const QK = 'commissions'

export function useCommissions() {
  return useQuery({ queryKey: [QK], queryFn: getCommissions })
}

export function useCommissionById(id: string) {
  return useQuery({
    queryKey: [QK, id],
    queryFn: () => getCommissionById(id),
    enabled: !!id,
  })
}

export function useCreateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CommissionInsert) => createCommission(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CommissionUpdate }) =>
      updateCommission(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCommission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useAddCommissionClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commissionId, clientId, tipo }: {
      commissionId: string
      clientId: string
      tipo: 'vendedor' | 'comprador'
    }) => addCommissionClient(commissionId, clientId, tipo),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useRemoveCommissionClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commissionId, clientId }: { commissionId: string; clientId: string }) =>
      removeCommissionClient(commissionId, clientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useCreateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IncomeInsert) => createIncome(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncomeInsert> }) =>
      updateIncome(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}
