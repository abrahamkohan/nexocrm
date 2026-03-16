// src/components/projects/PhotoGallery.tsx
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicUrl } from '@/lib/storage'
import type { Database } from '@/types/database'

type PhotoRow = Database['public']['Tables']['project_photos']['Row']

interface PhotoGalleryProps {
  photos: PhotoRow[]
  onDelete: (photo: PhotoRow) => void
  isDeleting?: boolean
}

export function PhotoGallery({ photos, onDelete, isDeleting }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
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
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDelete(photo)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
