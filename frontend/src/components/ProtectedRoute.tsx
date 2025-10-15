import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, token } = useAuthStore()
  const location = useLocation()

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If admin required but user is not admin
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
