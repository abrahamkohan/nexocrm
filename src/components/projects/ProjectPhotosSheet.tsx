// src/components/projects/ProjectPhotosSheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PhotoGallery } from './PhotoGallery'
import { PhotoUpload } from './PhotoUpload'
import { useProjectPhotos } from '@/hooks/useProjectPhotos'

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
  const { data: photos = [] } = useProjectPhotos(projectId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Fotos — {projectName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          <PhotoUpload projectId={projectId} sortOrderStart={photos.length} />
          <PhotoGallery projectId={projectId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
