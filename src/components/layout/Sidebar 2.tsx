import { NavLink } from 'react-router-dom'
import { Building2, Users, Calculator, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/proyectos', label: 'Proyectos', icon: Building2 },
  { to: '/clientes',  label: 'Clientes',  icon: Users },
  { to: '/simulador', label: 'Simulador', icon: Calculator },
  { to: '/informes',  label: 'Informes',  icon: FileText },
] as const

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-1 p-4 border-r bg-sidebar h-full">
      <div className="px-3 py-2 mb-4">
        <h1 className="text-sm font-semibold text-foreground">Sistema Inmobiliario</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
