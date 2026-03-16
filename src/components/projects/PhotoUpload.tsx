// src/components/projects/PhotoUpload.tsx
import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAddProjectPhoto } from '@/hooks/useProjectPhotos'

interface PhotoUploadProps {
  projectId: string
  sortOrderStart: number
}

export function PhotoUpload({ projectId, sortOrderStart }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addPhoto = useAddProjectPhoto(projectId)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      await addPhoto.mutateAsync({
        file: files[i],
        sortOrder: sortOrderStart + i,
      })
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={addPhoto.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        {addPhoto.isPending ? 'Subiendo...' : 'Subir fotos'}
      </Button>
    </div>
  )
}
