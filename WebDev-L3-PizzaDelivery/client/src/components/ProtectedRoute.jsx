import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role }) {
  const { user, token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-10 text-center text-muted">Loading your account…</p>
  }
  if (!token || !user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace state={{ from: location }} />
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/orders' : '/menu'} replace />
  }
  return <Outlet />
}
