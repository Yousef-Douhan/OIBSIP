import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AdminLogin from './pages/auth/AdminLogin'

import Menu from './pages/user/Menu'
import Builder from './pages/user/Builder'
import MyOrders from './pages/user/MyOrders'

import AdminOrders from './pages/admin/AdminOrders'
import AdminInventory from './pages/admin/AdminInventory'

function Home() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/orders' : '/menu'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* customers */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<Layout />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/build" element={<Builder />} />
          <Route path="/orders" element={<MyOrders />} />
        </Route>
      </Route>

      {/* admin */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<Layout />}>
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
