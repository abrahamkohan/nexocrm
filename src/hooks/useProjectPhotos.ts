// src/hooks/useProjectPhotos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjectPhotos, addProjectPhoto, deleteProjectPhoto } from '@/lib/projectPhotos'
import type { Database } from '@/types/database'

type PhotoRow = Database['public']['Tables']['project_photos']['Row']

export function useProjectPhotos(projectId: string) {
  return useQuery({
    queryKey: ['project_photos', projectId],
    queryFn: () => getProjectPhotos(projectId),
    enabled: !!projectId,
  })
}

export function useAddProjectPhoto(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, sortOrder }: { file: File; sortOrder: number }) =>
      addProjectPhoto(projectId, file, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_photos', projectId] }),
  })
}

export function useDeleteProjectPhoto(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photo: PhotoRow) => deleteProjectPhoto(photo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project_photos', projectId] }),
  })
}
