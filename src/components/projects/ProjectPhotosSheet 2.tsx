// src/components/projects/ProjectPhotosSheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PhotoGallery } from './PhotoGallery'
import { PhotoUpload } from './PhotoUpload'
import { useProjectPhotos, useAddProjectPhoto, useDeleteProjectPhoto } from '@/hooks/useProjectPhotos'
import type { Database } from '@/types/database'

type PhotoRow = Database['public']['Tables']['project_photos']['Row']

interface ProjectPhotosSheetProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectPhotosSheet({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectPhotosSheetProps) {
  const { data: photos = [], isLoading } = useProjectPhotos(projectId)
  const addPhoto = useAddProjectPhoto(projectId)
  const deletePhoto = useDeleteProjectPhoto(projectId)

  async function handleUpload(files: File[]) {
    const base = photos.length
    await Promise.all(
      files.map((file, i) =>
        addPhoto.mutateAsync({ file, sortOrder: base + i })
      )
    )
  }

  function handleDelete(photo: PhotoRow) {
    if (!confirm('¿Eliminar esta foto?')) return
    deletePhoto.mutate(photo)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Fotos — {projectName}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <PhotoUpload onUpload={handleUpload} isUploading={addPhoto.isPending} />
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center">Cargando fotos...</p>
          ) : (
            <PhotoGallery
              photos={photos}
              onDelete={handleDelete}
              isDeleting={deletePhoto.isPending}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
