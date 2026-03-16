// src/pages/ProyectosPage.tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ProjectList } from '@/components/projects/ProjectList'
import { ProjectForm, type ProjectFormValues } from '@/components/projects/ProjectForm'
import {
  useProjects, useCreateProject, useUpdateProject, useDeleteProject,
} from '@/hooks/useProjects'
import { uploadProjectBrochure } from '@/lib/storage'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

export function ProyectosPage() {
  const { data: projects = [], isLoading, isError } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(project: ProjectRow) {
    setEditing(project)
    setSheetOpen(true)
  }

  function handleDelete(project: ProjectRow) {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) return
    deleteProject.mutate(project.id)
  }

  async function handleSubmit(values: ProjectFormValues, brochureFile: File | null) {
    const basePayload = {
      name: values.name,
      status: values.status,
      description: values.description ?? null,
      location: values.location ?? null,
      delivery_date: values.delivery_date ?? null,
      developer_name: values.developer_name ?? null,
      usd_to_pyg_rate: values.usd_to_pyg_rate ?? null,
      amenities: values.amenities ?? editing?.amenities ?? [],
      brochure_path: editing?.brochure_path ?? null,
    }

    if (editing) {
      let brochure_path = basePayload.brochure_path
      if (brochureFile) {
        brochure_path = await uploadProjectBrochure(editing.id, brochureFile)
      }
      await updateProject.mutateAsync({ id: editing.id, input: { ...basePayload, brochure_path } })
    } else {
      const created = await createProject.mutateAsync(basePayload)
      if (brochureFile) {
        const brochure_path = await uploadProjectBrochure(created.id, brochureFile)
        await updateProject.mutateAsync({ id: created.id, input: { brochure_path } })
      }
    }
    setSheetOpen(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-5 h-40 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">Error al cargar los proyectos. Revisá tu conexión.</p>
      )}

      {!isLoading && !isError && (
        <ProjectList
          projects={projects}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProjectForm
              key={editing?.id ?? 'new'}
              defaultValues={editing ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => setSheetOpen(false)}
              isSubmitting={createProject.isPending || updateProject.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
