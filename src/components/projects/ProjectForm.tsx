// src/components/projects/ProjectForm.tsx
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AmenitiesCheckbox } from './AmenitiesCheckbox'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['en_pozo', 'en_construccion', 'entregado']),
  delivery_date: z.string().optional(),
  developer_name: z.string().optional(),
  amenities: z.array(z.string()),
  usd_to_pyg_rate: z.number().positive().nullable().optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  defaultValues?: Partial<ProjectRow>
  onSubmit: (values: ProjectFormValues, brochureFile: File | null) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProjectForm({ defaultValues, onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const brochureRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      location: defaultValues?.location ?? '',
      status: defaultValues?.status ?? 'en_pozo',
      delivery_date: defaultValues?.delivery_date ?? '',
      developer_name: defaultValues?.developer_name ?? '',
      amenities: defaultValues?.amenities ?? [],
      usd_to_pyg_rate: defaultValues?.usd_to_pyg_rate ?? null,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const brochureFile = brochureRef.current?.files?.[0] ?? null
    await onSubmit(values, brochureFile)
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...form.register('name')} placeholder="Ej: Edificio Torres del Sol" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" {...form.register('description')} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" {...form.register('location')} placeholder="Asunción, Paraguay" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="developer_name">Desarrolladora</Label>
          <Input id="developer_name" {...form.register('developer_name')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Estado</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) => form.setValue('status', v as ProjectFormValues['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en_pozo">En pozo</SelectItem>
              <SelectItem value="en_construccion">En construcción</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="delivery_date">Fecha de entrega</Label>
          <Input id="delivery_date" type="date" {...form.register('delivery_date')} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Amenities</Label>
        <AmenitiesCheckbox
          value={form.watch('amenities')}
          onChange={(v) => form.setValue('amenities', v)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="brochure">Brochure (PDF)</Label>
        <input
          ref={brochureRef}
          id="brochure"
          type="file"
          accept=".pdf"
          className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground cursor-pointer"
        />
        {defaultValues?.brochure_path && (
          <p className="text-xs text-muted-foreground">Ya hay un brochure cargado. Seleccioná un nuevo archivo para reemplazarlo.</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
