// src/components/projects/PhotoUpload.tsx
import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoUploadProps {
  onUpload: (files: File[]) => Promise<void>
  isUploading?: boolean
}

export function PhotoUpload({ onUpload, isUploading }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    await onUpload(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3 transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <ImagePlus className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium">{isUploading ? 'Subiendo...' : 'Subir fotos'}</p>
        <p className="text-xs text-muted-foreground">Arrastrá o hacé clic para seleccionar imágenes</p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={isUploading}>
        Seleccionar archivos
      </Button>
    </div>
  )
}
