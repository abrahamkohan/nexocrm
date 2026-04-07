// src/components/ui/DesktopFormScreen.tsx
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DesktopFormScreenProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  backLabel?: string
  onBack?: () => void
}

export function DesktopFormScreen({ open, onClose, title, children, backLabel, onBack }: DesktopFormScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="hidden md:flex fixed inset-0 z-50 flex-col bg-white">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex-1 min-w-0">
          {backLabel && onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-0.5">
              ← {backLabel}
            </button>
          )}
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── CONTENT (scrollable) ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden px-8 py-6"
        >
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}