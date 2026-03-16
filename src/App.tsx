import { Theme } from '@radix-ui/themes'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/LoginPage'

export function App() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <Theme
      accentColor="indigo"
      grayColor="slate"
      radius="large"
      scaling="100%"
      appearance="light"
      hasBackground={false}
    >
      {session ? <RouterProvider router={router} /> : <LoginPage />}
    </Theme>
  )
}
