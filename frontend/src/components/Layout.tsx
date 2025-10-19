import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  BookOpen,
  StickyNote,
  Clock,
  UserCheck,
  ListChecks
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Membros', href: '/members', icon: Users },
  { name: 'Eventos', href: '/events', icon: Calendar },
  { name: 'Finanças', href: '/finances', icon: DollarSign },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const contentNavigation = [
    { name: 'Devocionais', href: '/devotionals', icon: BookOpen },
    { name: 'Observações', href: '/observations', icon: StickyNote },
    { name: 'Ensaios', href: '/rehearsals', icon: Clock },
    { name: 'Grupos', href: '/groups', icon: Users },
    { name: 'Escalas', href: '/scales', icon: ListChecks },
  ]

  const adminOnlyNavigation = [
    { name: 'Chamada de Presença', href: '/attendance', icon: UserCheck },
  ]

  const filteredNavigation = user?.role === 'ADMIN'
    ? navigation
    : navigation.filter(n => n.name === 'Dashboard' || n.name === 'Eventos')

  const navItems = user?.role === 'ADMIN'
    ? [...filteredNavigation, ...contentNavigation, ...adminOnlyNavigation]
    : [...filteredNavigation, ...contentNavigation]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-primary">Exaltart</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto border-t border-gray-200 p-4">
            <div className="text-sm mb-3">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-gray-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/profile" title="Meu Perfil" onClick={() => setSidebarOpen(false)}>
                <Button variant="outline" size="sm">Meu Perfil</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => { handleLogout(); setSidebarOpen(false); }} title="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-primary">Exaltart</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="text-sm mb-3">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-gray-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/profile" title="Meu Perfil">
                <Button variant="outline" size="sm">Meu Perfil</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-gray-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
