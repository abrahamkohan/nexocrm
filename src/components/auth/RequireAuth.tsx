// src/components/auth/RequireAuth.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getProfile } from '@/lib/profile'
import { LoginPage } from '@/pages/LoginPage'
import { CompleteProfilePage } from '@/pages/CompleteProfilePage'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, isMockMode } = useAuth()
  const [needsProfile, setNeedsProfile] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkProfile() {
      if (!session?.user?.id) {
        setChecking(false)
        return
      }

      try {
        const profile = await getProfile(session.user.id)
        
        if (!profile?.full_name || profile.full_name.trim().length < 3) {
          setNeedsProfile(true)
        }
      } catch (e) {
        console.error('[RequireAuth] error checking profile:', e)
      } finally {
        setChecking(false)
      }
    }

    if (!loading && session) {
      checkProfile()
    } else if (!loading && !session) {
      setChecking(false)
    }
  }, [session, loading])

  // Loading o checking - mostrar spinner
  if (loading || checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#14223A' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) return <LoginPage />

  if (needsProfile) {
    // Only show complete profile page, no access to anything else
    return <CompleteProfilePage />
  }

  return <>{children}</>
}
