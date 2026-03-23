// src/components/projects/ProyectoFilters.tsx
// Componente visual puro — recibe estado y callbacks por props.
import { useState } from 'react'
import { Search, SlidersHorizontal, ChevronUp } from 'lucide-react'

export interface FilterState {
  status:    string
  location:  string
  developer: string
}

interface ProyectoFiltersProps {
  search:          string
  filters:         FilterState
  onSearchChange:  (value: string) => void
  onFilterChange:  (filters: FilterState) => void
  locations:       string[]
  developers:      string[]
}

const SELECT_CLS = 'h-9 w-full px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring'
const LABEL_CLS  = 'text-xs font-medium text-muted-foreground mb-1 block'

export function ProyectoFilters({
  search, filters, onSearchChange, onFilterChange, locations, developers,
}: ProyectoFiltersProps) {
  const [open, setOpen] = useState(false)

  const activeCount = [filters.status, filters.location, filters.developer].filter(Boolean).length

  return (
    <div className="flex flex-col gap-2">

      {/* Barra principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar proyecto, zona..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border text-sm font-medium transition-colors ${
            open || activeCount > 0
              ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
              : 'border-input bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtros avanzados */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <div>
            <label className={LABEL_CLS}>Estado</label>
            <select
              value={filters.status}
              onChange={e => onFilterChange({ ...filters, status: e.target.value })}
              className={SELECT_CLS}
            >
              <option value="">Todos</option>
              <option value="en_pozo">En pozo</option>
              <option value="en_construccion">En construcción</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Zona</label>
            <select
              value={filters.location}
              onChange={e => onFilterChange({ ...filters, location: e.target.value })}
              className={SELECT_CLS}
            >
              <option value="">Todas</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Desarrolladora</label>
            <select
              value={filters.developer}
              onChange={e => onFilterChange({ ...filters, developer: e.target.value })}
              className={SELECT_CLS}
            >
              <option value="">Todas</option>
              {developers.map(dev => <option key={dev} value={dev}>{dev}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
