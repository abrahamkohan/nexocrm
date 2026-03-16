// src/components/projects/ProjectForm.tsx
import { useState } from 'react'
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
  usd_to_pyg_rate: z.number().positive().nullable().optional(),
  amenities: z.array(z.string()).optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  defaultValues?: Partial<ProjectRow>
  onSubmit: (values: ProjectFormValues, brochureFile: File | null) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProjectForm({ defaultValues, onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const [brochureFile, setBrochureFile] = useState<File | null>(null)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      location: defaultValues?.location ?? '',
      status: defaultValues?.status ?? 'en_pozo',
      delivery_date: defaultValues?.delivery_date ?? '',
      developer_name: defaultValues?.developer_name ?? '',
      usd_to_pyg_rate: defaultValues?.usd_to_pyg_rate ?? null,
      amenities: defaultValues?.amenities ?? [],
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, brochureFile)
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...form.register('name')} placeholder="Ej: Torre Madero" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="status">Estado *</Label>
        <Select
          value={form.watch('status')}
          onValueChange={(v) => form.setValue('status', v as ProjectFormValues['status'])}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en_pozo">En Pozo</SelectItem>
            <SelectItem value="en_construccion">En Construcción</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="location">Ubicación</Label>
        <Input id="location" {...form.register('location')} placeholder="Ej: Asunción, Paraguay" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="developer_name">Desarrollador</Label>
        <Input id="developer_name" {...form.register('developer_name')} placeholder="Ej: Inmobiliaria XYZ" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="delivery_date">Fecha de entrega</Label>
        <Input id="delivery_date" type="date" {...form.register('delivery_date')} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" {...form.register('description')} rows={3} placeholder="Descripción del proyecto..." />
      </div>

      <div className="grid gap-1.5">
        <Label>Amenities</Label>
        <AmenitiesCheckbox
          value={form.watch('amenities') ?? []}
          onChange={(v) => form.setValue('amenities', v)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="usd_to_pyg_rate">Tasa USD/PYG (opcional)</Label>
        <Input
          id="usd_to_pyg_rate"
          type="number"
          step="1"
          {...form.register('usd_to_pyg_rate', {
            setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
          })}
          placeholder="Ej: 7800 (deja vacío para usar tasa global)"
        />
        <p className="text-xs text-muted-foreground">Si se deja vacío, se usa la tasa global de la app</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="brochure">Brochure PDF</Label>
        {defaultValues?.brochure_path && (
          <p className="text-xs text-muted-foreground">
            Actual: {defaultValues.brochure_path.split('/').pop()}
          </p>
        )}
        <Input
          id="brochure"
          type="file"
          accept=".pdf"
          onChange={(e) => setBrochureFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          {defaultValues?.brochure_path
            ? 'Subir un nuevo PDF reemplazará el actual'
            : 'Opcional — PDF del brochure del proyecto'}
        </p>
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
