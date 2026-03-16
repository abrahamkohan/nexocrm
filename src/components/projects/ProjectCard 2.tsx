// src/components/projects/ProjectCard.tsx
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, MapPin, Calendar, Images, CreditCard, LayoutGrid } from 'lucide-react'
import { ProjectPhotosSheet } from './ProjectPhotosSheet'
import { FinancingPlansSheet } from './FinancingPlansSheet'
import { TypologiesSheet } from '@/components/typologies/TypologiesSheet'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const STATUS_CONFIG = {
  en_pozo: { label: 'En Pozo', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  en_construccion: { label: 'En Construcción', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  entregado: { label: 'Entregado', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
} as const

interface ProjectCardProps {
  project: ProjectRow
  onEdit: (project: ProjectRow) => void
  onDelete: (project: ProjectRow) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const status = STATUS_CONFIG[project.status]
  const [photosOpen, setPhotosOpen] = useState(false)
  const [financingOpen, setFinancingOpen] = useState(false)
  const [typologiesOpen, setTypologiesOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-tight">{project.name}</h3>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      {project.location && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{project.location}</span>
        </div>
      )}

      {project.delivery_date && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Entrega: {project.delivery_date}</span>
        </div>
      )}

      {project.developer_name && (
        <p className="text-sm text-muted-foreground">{project.developer_name}</p>
      )}

      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(project)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setTypologiesOpen(true)}
        >
          <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
          Tipolog.
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setPhotosOpen(true)}
        >
          <Images className="h-3.5 w-3.5 mr-1.5" />
          Fotos
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setFinancingOpen(true)}
        >
          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
          Financ.
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(project)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ProjectPhotosSheet
        projectId={project.id}
        projectName={project.name}
        open={photosOpen}
        onOpenChange={setPhotosOpen}
      />

      <FinancingPlansSheet
        projectId={project.id}
        projectName={project.name}
        open={financingOpen}
        onOpenChange={setFinancingOpen}
      />

      <TypologiesSheet
        projectId={project.id}
        projectName={project.name}
        open={typologiesOpen}
        onOpenChange={setTypologiesOpen}
      />
    </div>
  )
}
