// src/hooks/useLeadPeek.ts
// Estado global liviano para el panel de previsualización de un lead.
// Usado en TaskItem para abrir el detalle sin navegar.

import { useState } from 'react'

interface LeadPeekState {
  isOpen:  boolean
  leadId:  string | null
}

export function useLeadPeek() {
  const [state, setState] = useState<LeadPeekState>({
    isOpen: false,
    leadId: null,
  })

  function openPeek(leadId: string) {
    setState({ isOpen: true, leadId })
  }

  function closePeek() {
    setState({ isOpen: false, leadId: null })
  }

  return {
    isOpen:    state.isOpen,
    leadId:    state.leadId,
    openPeek,
    closePeek,
  }
}
