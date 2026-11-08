import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }) =>
  `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
    isActive ? 'bg-white text-basil' : 'text-white/85 hover:text-white'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    navigate(isAdmin ? '/admin/login' : '/login')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-basil text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <NavLink to={isAdmin ? '/admin/orders' : '/menu'} className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl">Basilico</span>
            {isAdmin && <span className="rounded-full bg-crust px-2 py-0.5 text-xs font-bold text-basil">Kitchen</span>}
          </NavLink>

          <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto" aria-label="Main">
            {isAdmin ? (
              <>
                <NavLink to="/admin/orders" className={linkClass}>Orders</NavLink>
                <NavLink to="/admin/inventory" className={linkClass}>Inventory</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/menu" className={linkClass}>Menu</NavLink>
                <NavLink to="/build" className={linkClass}>Build a pizza</NavLink>
                <NavLink to="/orders" className={linkClass}>My orders</NavLink>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-white/80 sm:inline">{user?.name}</span>
            <button onClick={handleLogout} className="rounded-full border border-white/40 px-3 py-1 font-semibold hover:bg-white/10">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
