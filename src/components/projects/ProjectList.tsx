// src/components/projects/ProjectList.tsx
import { ProjectCard }         from './ProjectCard'
import { ProjectCardMobile }   from './ProjectCardMobile'
import { ProjectTableDesktop } from './ProjectTableDesktop'
import { ProyectoFilters, type FilterState } from './ProyectoFilters'
import type { Database } from '@/types/database'

type ProjectRow    = Database['public']['Tables']['projects']['Row']
type BadgeAnalisis = 'oportunidad' | 'estable' | 'a_evaluar'

interface ProjectListProps {
  projects:          ProjectRow[]
  search:            string
  filters:           FilterState
  onSearchChange:    (value: string) => void
  onFilterChange:    (filters: FilterState) => void
  onDelete:          (id: string) => void
  onTogglePublicado?: (id: string, value: boolean) => void
  onChangeBadge?:    (id: string, value: BadgeAnalisis | null) => void
  agencyPhone?:      string
}

export function ProjectList({
  projects,
  search,
  filters,
  onSearchChange,
  onFilterChange,
  onDelete,
  onTogglePublicado,
  onChangeBadge,
  agencyPhone,
}: ProjectListProps) {

  const locations  = [...new Set(projects.map(p => p.location).filter(Boolean))]      as string[]
  const developers = [...new Set(projects.map(p => p.developer_name).filter(Boolean))] as string[]

  return (
    <div className="flex flex-col gap-4">

      {/* Buscador + filtros */}
      <ProyectoFilters
        search={search}
        filters={filters}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        locations={locations}
        developers={developers}
      />

      {/* ── Mobile: cards compactas con WhatsApp CTA ── */}
      <div className="block md:hidden space-y-3">
        {projects.map(project => (
          <ProjectCardMobile
            key={project.id}
            project={project}
            agencyPhone={agencyPhone}
          />
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No se encontraron proyectos.</p>
        )}
      </div>

      {/* ── Desktop: tabla resumen + cards admin completas ── */}
      <div className="hidden md:flex flex-col gap-6">
        <ProjectTableDesktop projects={projects} onDelete={onDelete} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={onDelete}
              onTogglePublicado={onTogglePublicado}
              onChangeBadge={onChangeBadge}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
