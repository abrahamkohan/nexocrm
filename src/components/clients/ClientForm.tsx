// src/components/clients/ClientForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

const clientSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  defaultValues?: Partial<ClientRow>
  onSubmit: (values: ClientFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ClientForm({ defaultValues, onSubmit, onCancel, isSubmitting }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      nationality: defaultValues?.nationality ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="full_name">Nombre completo *</Label>
        <Input id="full_name" {...form.register('full_name')} placeholder="Ej: Juan García" />
        {form.formState.errors.full_name && (
          <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} placeholder="juan@email.com" />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...form.register('phone')} placeholder="+595 981 123456" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="nationality">Nacionalidad</Label>
        <Input id="nationality" {...form.register('nationality')} placeholder="Ej: Paraguayo, Argentino" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" {...form.register('notes')} rows={3} placeholder="Observaciones sobre el cliente..." />
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
