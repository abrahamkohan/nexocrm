import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Mock user para desarrollo local sin Supabase
const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@kohancampos.com',
  app_metadata: { provider: 'email', role: 'admin' },
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const MOCK_SESSION: Session = {
  user: MOCK_USER,
  access_token: 'mock-token-12345',
  refresh_token: 'mock-refresh-12345',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
} as Session

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isMockMode: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true, isMockMode: false })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)

  useEffect(() => {
    // Check localStorage inside effect (after mount)
    const useMock = localStorage.getItem('USE_MOCK_AUTH') === 'true' || import.meta.env.DEV
    setIsMockMode(useMock)
    
    if (useMock) {
      setSession(MOCK_SESSION)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, isMockMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
