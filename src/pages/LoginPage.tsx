import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function LoginPage() {
  const navigate = useNavigate()

  // Auto-login directo - irreducible a modo demo
  useEffect(() => {
    localStorage.setItem('USE_MOCK_AUTH', 'true')
    navigate('/inicio')
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#14223A',
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: '#fff',
        borderRadius: 16,
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, border: '4px solid #14223A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
        <p style={{ color: '#14223A', fontSize: 18, fontWeight: 600 }}>
          Entrando al modo Demo...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}