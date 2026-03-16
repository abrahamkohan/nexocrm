// src/components/typologies/TypologyCard.tsx
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/utils/money'
import { getPublicUrl } from '@/lib/storage'
import type { Database } from '@/types/database'

type TypologyRow = Database['public']['Tables']['typologies']['Row']

interface TypologyCardProps {
  typology: TypologyRow
  onEdit: (typology: TypologyRow) => void
  onDelete: (typology: TypologyRow) => void
}

export function TypologyCard({ typology, onEdit, onDelete }: TypologyCardProps) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{typology.name}</p>
          <p className="text-xs text-muted-foreground">{typology.area_m2} m²</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(typology)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(typology)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-semibold">{formatMoney(typology.price_usd, 'USD')}</span>
        {typology.price_pyg != null && (
          <span className="text-xs text-muted-foreground">
            {formatMoney(typology.price_pyg, 'PYG')}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {typology.units_available} unidad{typology.units_available !== 1 ? 'es' : ''} disponible{typology.units_available !== 1 ? 's' : ''}
      </p>

      {typology.floor_plan_path && (
        <a href={getPublicUrl(typology.floor_plan_path)} target="_blank" rel="noreferrer">
          <img
            src={getPublicUrl(typology.floor_plan_path)}
            alt="Plano"
            className="w-full rounded-md object-contain max-h-32 border bg-muted/30"
          />
        </a>
      )}
    </div>
  )
}
