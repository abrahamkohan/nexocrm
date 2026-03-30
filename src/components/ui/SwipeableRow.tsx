// src/components/ui/SwipeableRow.tsx
// Swipe-to-action para mobile.
// Swipe izquierda → acción derecha (ej: eliminar)
// Swipe derecha   → acción izquierda (ej: completar / archivar)

import { useRef, useState, type ReactNode } from 'react'

const REVEAL_WIDTH = 76   // px que ocupa cada botón revelado
const SNAP_RATIO   = 0.45 // fracción del reveal para hacer snap

interface SwipeAction {
  icon:      ReactNode
  label:     string
  color:     string        // bg color del botón, e.g. 'bg-red-500'
  onTrigger: () => void
}

interface SwipeableRowProps {
  children:     ReactNode
  leftAction?:  SwipeAction  // se revela al deslizar hacia la DERECHA
  rightAction?: SwipeAction  // se revela al deslizar hacia la IZQUIERDA
  className?:   string
}

export function SwipeableRow({ children, leftAction, rightAction, className }: SwipeableRowProps) {
  const [offset, setOffset]   = useState(0)
  const startX   = useRef(0)
  const startY   = useRef(0)
  const dragging = useRef(false)
  const lockedAxis = useRef<'h' | 'v' | null>(null)

  const maxLeft  = leftAction  ? REVEAL_WIDTH  : 0
  const maxRight = rightAction ? -REVEAL_WIDTH : 0

  function onTouchStart(e: React.TouchEvent) {
    startX.current    = e.touches[0].clientX
    startY.current    = e.touches[0].clientY
    dragging.current  = true
    lockedAxis.current = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    // Lock axis on first significant movement
    if (!lockedAxis.current) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        lockedAxis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }
      return
    }

    if (lockedAxis.current !== 'h') return

    e.preventDefault()
    const clamped = Math.max(maxRight, Math.min(maxLeft, dx + offset))
    setOffset(clamped)
  }

  function onTouchEnd() {
    if (!dragging.current) return
    dragging.current  = false
    lockedAxis.current = null

    if (offset > REVEAL_WIDTH * SNAP_RATIO)   { setOffset(REVEAL_WIDTH);  return }
    if (offset < -REVEAL_WIDTH * SNAP_RATIO)  { setOffset(-REVEAL_WIDTH); return }
    setOffset(0)
  }

  function close() { setOffset(0) }

  function triggerLeft() {
    close()
    setTimeout(() => leftAction?.onTrigger(), 150)
  }

  function triggerRight() {
    close()
    setTimeout(() => rightAction?.onTrigger(), 150)
  }

  const showLeft  = offset > 0
  const showRight = offset < 0

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>

      {/* ── Acción izquierda (swipe derecha) ── */}
      {leftAction && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={triggerLeft}
          className={`absolute inset-y-0 left-0 flex flex-col items-center justify-center gap-1 transition-opacity ${leftAction.color} ${showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ width: REVEAL_WIDTH }}
        >
          <span className="text-white">{leftAction.icon}</span>
          <span className="text-[10px] font-semibold text-white/90">{leftAction.label}</span>
        </button>
      )}

      {/* ── Acción derecha (swipe izquierda) ── */}
      {rightAction && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={triggerRight}
          className={`absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 transition-opacity ${rightAction.color} ${showRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ width: REVEAL_WIDTH }}
        >
          <span className="text-white">{rightAction.icon}</span>
          <span className="text-[10px] font-semibold text-white/90">{rightAction.label}</span>
        </button>
      )}

      {/* ── Contenido principal ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={offset !== 0 ? close : undefined}
        style={{
          transform:  `translateX(${offset}px)`,
          transition: dragging.current ? 'none' : 'transform 0.2s ease',
          position:   'relative',
          zIndex:     1,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
