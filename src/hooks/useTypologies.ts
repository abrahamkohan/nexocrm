// src/hooks/useTypologies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTypologies, createTypology, updateTypology, deleteTypology,
} from '@/lib/typologies'
import type { Database } from '@/types/database'

type TypologyInsert = Database['public']['Tables']['typologies']['Insert']
type TypologyUpdate = Database['public']['Tables']['typologies']['Update']

export function useTypologies(projectId: string) {
  return useQuery({
    queryKey: ['typologies', projectId],
    queryFn: () => getTypologies(projectId),
    enabled: !!projectId,
  })
}

export function useCreateTypology(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TypologyInsert) => createTypology(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['typologies', projectId] }),
  })
}

export function useUpdateTypology(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TypologyUpdate }) =>
      updateTypology(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['typologies', projectId] }),
  })
}

export function useDeleteTypology(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTypology(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['typologies', projectId] }),
  })
}
