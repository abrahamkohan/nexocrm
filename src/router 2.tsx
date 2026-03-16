import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProyectosPage } from '@/pages/ProyectosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { SimuladorPage } from '@/pages/SimuladorPage'
import { InformesPage } from '@/pages/InformesPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/proyectos" replace /> },
      { path: 'proyectos', element: <ProyectosPage /> },
      { path: 'clientes',  element: <ClientesPage /> },
      { path: 'simulador', element: <SimuladorPage /> },
      { path: 'informes',  element: <InformesPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
