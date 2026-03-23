// src/components/projects/ProjectCardMobile.tsx
// Card compacta mobile-first. Solo recibe datos por props — sin fetches.
import { useNavigate } from 'react-router'
import { MessageCircle, MapPin, Building2 } from 'lucide-react'
import { cleanDigits } from '@/lib/phone'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const STATUS_LABEL: Record<ProjectRow['status'], string> = {
  en_pozo:          'En pozo',
  en_construccion:  'En construcción',
  entregado:        'Entregado',
}

const STATUS_CLS: Record<ProjectRow['status'], string> = {
  en_pozo:         'bg-amber-100 text-amber-700',
  en_construccion: 'bg-blue-100  text-blue-700',
  entregado:       'bg-green-100 text-green-700',
}

interface ProjectCardMobileProps {
  project:      ProjectRow
  agencyPhone?: string   // número limpio, ej: "595981123456"
}

export function ProjectCardMobile({ project, agencyPhone }: ProjectCardMobileProps) {
  const navigate = useNavigate()

  function handleWhatsApp(e: React.MouseEvent) {
    e.stopPropagation()
    if (!agencyPhone) return
    const clean = cleanDigits(agencyPhone)
    const msg   = encodeURIComponent(
      `Hola! Me interesa el proyecto *${project.name}*${project.location ? ` en ${project.location}` : ''}. ¿Podés darme más información?`
    )
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] overflow-hidden active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/proyectos/${project.id}/editar`)}
    >
      {/* Cuerpo */}
      <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">

        {/* Fila: estado + badge análisis */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[project.status]}`}>
            {STATUS_LABEL[project.status]}
          </span>
          {project.badge_analisis && (
            <span className="text-[11px] font-medium text-[#D4AF37]">
              ★ {project.badge_analisis}
            </span>
          )}
        </div>

        {/* Nombre */}
        <p className="text-sm font-bold text-gray-900 leading-tight">{project.name}</p>

        {/* Zona */}
        {project.location && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {/* Desarrolladora */}
        {project.developer_name && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.developer_name}</span>
          </div>
        )}
      </div>

      {/* CTA WhatsApp */}
      {agencyPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="w-4 h-4" />
          Consultar por WhatsApp
        </button>
      )}
    </div>
  )
}
