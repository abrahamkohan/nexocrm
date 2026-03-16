// src/components/projects/ProjectList.tsx
import { ProjectCard } from './ProjectCard'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

interface ProjectListProps {
  projects: ProjectRow[]
  onEdit: (project: ProjectRow) => void
  onDelete: (project: ProjectRow) => void
}

export function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">No hay proyectos todavía.</p>
        <p className="text-muted-foreground text-sm">Hacé clic en "Nuevo Proyecto" para comenzar.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
