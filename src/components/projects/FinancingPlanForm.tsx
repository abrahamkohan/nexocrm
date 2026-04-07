// src/components/projects/FinancingPlanForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/types/database'

type PlanRow = Database['public']['Tables']['financing_plans']['Row']

const planSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  anticipo_pct: z.number().min(0).max(100),
  cuotas: z.number().int().min(0),
  tasa_interes_pct: z.number().min(0).max(100).nullable().optional(),
  pago_final_pct: z.number().min(0).max(100).nullable().optional(),
  notas: z.string().optional(),
})

export type PlanFormValues = z.infer<typeof planSchema>

interface FinancingPlanFormProps {
  defaultValues?: Partial<PlanRow>
  onSubmit: (values: PlanFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

function numField(v: unknown) {
  return v === '' || v == null ? null : Number(v)
}

export function FinancingPlanForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: FinancingPlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      anticipo_pct: defaultValues?.anticipo_pct ?? 0,
      cuotas: defaultValues?.cuotas ?? 0,
      tasa_interes_pct: defaultValues?.tasa_interes_pct ?? null,
      pago_final_pct: defaultValues?.pago_final_pct ?? null,
      notas: defaultValues?.notas ?? '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="fp-name">Nombre del plan *</Label>
        <Input id="fp-name" {...form.register('name')} placeholder="Ej: Contado, 30/70, Cuotas" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fp-anticipo">Anticipo % *</Label>
          <Input
            id="fp-anticipo"
            type="number"
            min={0}
            max={100}
            step={0.1}
            {...form.register('anticipo_pct', { setValueAs: (v) => Number(v) })}
          />
          {form.formState.errors.anticipo_pct && (
            <p className="text-xs text-destructive">{form.formState.errors.anticipo_pct.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fp-cuotas">Cuotas *</Label>
          <Input
            id="fp-cuotas"
            type="number"
            min={0}
            step={1}
            {...form.register('cuotas', { setValueAs: (v) => Number(v) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fp-tasa">Tasa interés %</Label>
          <Input
            id="fp-tasa"
            type="number"
            min={0}
            step={0.01}
            placeholder="Opcional"
            {...form.register('tasa_interes_pct', { setValueAs: numField })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fp-final">Pago final %</Label>
          <Input
            id="fp-final"
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="Opcional"
            {...form.register('pago_final_pct', { setValueAs: numField })}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="fp-notas">Notas</Label>
        <Textarea
          id="fp-notas"
          {...form.register('notas')}
          rows={2}
          placeholder="Condiciones adicionales..."
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting} size="sm" className="flex-1">
          {isSubmitting ? 'Guardando...' : 'Guardar plan'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
