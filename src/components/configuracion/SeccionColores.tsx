// src/components/configuracion/SeccionColores.tsx
import { useState, useEffect } from 'react'
import { ColorPreview } from './ColorPreview'

interface Props {
  color_primary: string
  color_secondary: string
  color_accent: string
  nombre: string
  onChange: (key: string, value: string) => void
}

// Presets completos: sidebar + primary + accent
const PRESETS = [
  { 
    name: 'classic', 
    label: 'Classic', 
    sidebar: '#122038', 
    primary: '#C9B34E', 
    accent: '#C9B99A',
    description: 'Azul oscuro con dorado'
  },
  { 
    name: 'minimal', 
    label: 'Minimal', 
    sidebar: '#1F2937', 
    primary: '#10B981', 
    accent: '#34D399',
    description: 'Gris oscuro con verde'
  },
  { 
    name: 'warm', 
    label: 'Warm', 
    sidebar: '#1C1917', 
    primary: '#F59E0B', 
    accent: '#FBBF24',
    description: 'Marrón con ámbar'
  },
  { 
    name: 'rose', 
    label: 'Rose', 
    sidebar: '#1C1420', 
    primary: '#F43F5E', 
    accent: '#FB7185',
    description: 'Vinotinto con rosa'
  },
  { 
    name: 'light', 
    label: 'Light', 
    sidebar: '#F5F5F3', 
    primary: '#1A1A18', 
    accent: '#2563EB',
    description: 'Blanco cálido minimal'
  },
  { 
    name: 'neutral', 
    label: 'Neutral', 
    sidebar: '#F9FAFB', 
    primary: '#111827', 
    accent: '#6B7280',
    description: 'Gris elegante'
  },
  { 
    name: 'claude', 
    label: 'Claude', 
    sidebar: '#E7E5DD', 
    primary: '#DA7756', 
    accent: '#C15F3C',
    description: 'Cálido terracota'
  },
  { 
    name: 'claude-dark', 
    label: 'Claude Dark', 
    sidebar: '#2B2A27', 
    primary: '#DA7756', 
    accent: '#F59E0B',
    description: 'Terracota oscuro'
  },
]

export function SeccionColores({ color_primary, color_secondary, color_accent, nombre, onChange }: Props) {
  const values: Record<string, string> = { color_primary, color_secondary, color_accent }
  
  // Estado para el color actual del sidebar - sincronizado con la prop
  const [sidebarColor, setSidebarColor] = useState(color_secondary || '#122038')
  
  // Sincronizar cuando la prop cambia (ej: después de guardar)
  useEffect(() => {
    setSidebarColor(color_secondary || '#122038')
  }, [color_secondary])

  // Función para verificar si un preset está seleccionado (exact match)
  function isPresetSelected(preset: typeof PRESETS[0]): boolean {
    return (
      values.color_primary?.toLowerCase() === preset.primary.toLowerCase() &&
      sidebarColor.toLowerCase() === preset.sidebar.toLowerCase() &&
      values.color_accent?.toLowerCase() === preset.accent.toLowerCase()
    )
  }

  // Función para aplicar preset completo
  function applyPreset(preset: typeof PRESETS[0]) {
    setSidebarColor(preset.sidebar)
    onChange('color_secondary', preset.sidebar)
    onChange('color_primary', preset.primary)
    onChange('color_accent', preset.accent)
  }

  // Función para cambiar solo el sidebar (sin romper primary/accent)
  function handleSidebarChange(color: string) {
    setSidebarColor(color)
    onChange('color_secondary', color)
  }

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
      <p className="text-base font-semibold text-foreground">🎨 Colores del sistema</p>

      {/* Colores principales con labels claros */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="color"
              value={values.color_primary || '#C9B34E'}
              onChange={e => onChange('color_primary', e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 cursor-pointer"
            />
            <div>
              <p className="text-xs font-medium text-gray-800">Botones</p>
              <p className="text-[10px] text-gray-400">CTAs, acciones</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="color"
              value={sidebarColor}
              onChange={e => handleSidebarChange(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 cursor-pointer"
            />
            <div>
              <p className="text-xs font-medium text-gray-800">Sidebar</p>
              <p className="text-[10px] text-gray-400">Fondo lateral</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="color"
              value={values.color_accent || '#C9B99A'}
              onChange={e => onChange('color_accent', e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 cursor-pointer"
            />
            <div>
              <p className="text-xs font-medium text-gray-800">Highlights</p>
              <p className="text-[10px] text-gray-400">Links, iconos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Presets completos (aplican todos los colores) */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">🎯 Presets (aplica todo)</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map(preset => {
            const selected = isPresetSelected(preset)
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                  selected
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                    : 'border-border hover:border-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="w-full h-6 rounded flex overflow-hidden">
                  <div className="w-1/3" style={{ backgroundColor: preset.sidebar }} />
                  <div className="w-1/3" style={{ backgroundColor: preset.primary }} />
                  <div className="w-1/3" style={{ backgroundColor: preset.accent }} />
                </div>
                <span className={`text-[10px] font-medium ${selected ? 'text-[var(--brand-primary)]' : 'text-foreground'}`}>
                  {preset.label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Al elegir preset se applied los 3 colores juntos
        </p>
      </div>

      {/* Preview */}
      <ColorPreview
        primary={values.color_primary || '#C9B34E'}
        secondary={sidebarColor}
        accent={values.color_accent || '#C9B99A'}
        nombre={nombre}
      />
    </div>
  )
}