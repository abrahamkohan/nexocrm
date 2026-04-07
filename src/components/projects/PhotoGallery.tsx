// src/components/projects/PhotoGallery.tsx
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectPhotos, useDeleteProjectPhoto } from '@/hooks/useProjectPhotos'
import { getPublicUrl } from '@/lib/storage'

interface PhotoGalleryProps {
  projectId: string
}

export function PhotoGallery({ projectId }: PhotoGalleryProps) {
  const { data: photos = [], isLoading } = useProjectPhotos(projectId)
  const deletePhoto = useDeleteProjectPhoto(projectId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-4">Cargando fotos...</p>
  }

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay fotos todavía.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
          <img
            src={getPublicUrl(photo.storage_path)}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 text-white hover:text-white hover:bg-destructive/80"
              onClick={() => deletePhoto.mutate(photo)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
