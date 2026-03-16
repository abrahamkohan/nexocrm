// src/components/auth/RequireAuth.tsx
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/LoginPage'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <LoginPage />
  return <>{children}</>
}
