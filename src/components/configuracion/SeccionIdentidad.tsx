// src/components/configuracion/SeccionIdentidad.tsx
import { Image } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  nombre:        string
  slogan:        string
  logo_url:      string
  logo_light_url:string
  pwa_icon_url:  string
  og_image_url:  string
  onChange: (key: string, value: string) => void
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function LogoField({ label, value, onChange, placeholder, hint, preview, aspectHint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
  preview?: 'dark' | 'light' | 'square'
  aspectHint?: string
}) {
  const bgClass =
    preview === 'dark'   ? 'bg-[#1E3A5F]' :
    preview === 'square' ? 'bg-gray-100 border-dashed' :
    'bg-gray-50'

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Image className="h-3.5 w-3.5" />{label}
      </Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {value ? (
        <div className={`mt-1 p-3 border rounded-md flex items-center justify-center ${bgClass} ${
          preview === 'square' ? 'h-20 w-20' : 'h-16'
        }`}>
          <img src={value} alt="Preview" className="max-h-12 max-w-full object-contain" />
        </div>
      ) : aspectHint ? (
        <p className="text-[10px] text-muted-foreground/60 italic">{aspectHint}</p>
      ) : null}
    </div>
  )
}

export function SeccionIdentidad({ nombre, slogan, logo_url, logo_light_url, pwa_icon_url, og_image_url, onChange }: Props) {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🏠 Identidad del negocio</p>

      {/* Datos básicos */}
      <div className="flex flex-col gap-4">
        <Field
          label="Nombre de la empresa"
          value={nombre}
          onChange={v => onChange('nombre', v)}
          placeholder="Ej: Kohan & Campos"
        />
        <Field
          label="Slogan"
          value={slogan}
          onChange={v => onChange('slogan', v)}
          placeholder="Ej: Inversiones inmobiliarias de alto valor"
        />
      </div>

      {/* Logos */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logos</p>

        <div className="grid sm:grid-cols-2 gap-5">
          <LogoField
            label="Logo oscuro — para fondos claros"
            value={logo_light_url}
            onChange={v => onChange('logo_light_url', v)}
            placeholder="https://..."
            hint="Usado en landings, emails y catálogo"
            preview="light"
            aspectHint="Horizontal · PNG transparente"
          />
          <LogoField
            label="Logo claro — para fondos oscuros"
            value={logo_url}
            onChange={v => onChange('logo_url', v)}
            placeholder="https://..."
            hint="Usado en el sidebar del CRM y PDFs"
            preview="dark"
            aspectHint="Horizontal · PNG transparente"
          />
        </div>

        {/* Specs */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex flex-col gap-1">
          <p className="text-xs font-semibold text-gray-600">📐 Especificaciones para logos</p>
          <ul className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
            <li>• PNG con fondo transparente</li>
            <li>• Máximo 400 × 150 px · menos de 100 KB</li>
            <li>• Horizontal: isotipo + nombre de la empresa</li>
          </ul>
        </div>
      </div>

      {/* Íconos y meta */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Íconos y redes sociales</p>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />Favicon / Ícono PWA
            </Label>
            <Input
              value={pwa_icon_url}
              onChange={e => onChange('pwa_icon_url', e.target.value)}
              placeholder="https://..."
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Ícono del tab y app instalada · cuadrado 512×512 PNG</p>
            {pwa_icon_url && (
              <div className="mt-1 flex items-center gap-3 p-2 border rounded-md bg-muted">
                <img src={pwa_icon_url} alt="Favicon" className="w-10 h-10 object-cover rounded-xl border" />
                <p className="text-xs text-muted-foreground">Vista previa del ícono instalado</p>
              </div>
            )}
          </div>

          <LogoField
            label="OG Image — imagen para redes sociales"
            value={og_image_url}
            onChange={v => onChange('og_image_url', v)}
            placeholder="https://..."
            hint="Se muestra al compartir el link en WhatsApp, Instagram, etc."
            preview="light"
            aspectHint="1200 × 630 px · JPG o PNG"
          />
        </div>
      </div>
    </div>
  )
}
