import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, ClipboardList, Users, MessageSquare, Settings,
  LogOut, Menu,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { parseApiError } from '../utils/errorHandler'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appointments', label: 'Appointments', icon: ClipboardList },
  { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { admin, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setSidebarOpen(false), [location])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (err) {
      showToast(parseApiError(err), 'error')
    }
  }

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-600 z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex`}
        aria-label="Admin sidebar"
      >
        {/* Logo */}
        <div className="p-5 border-b border-dark-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" width="16" height="16" aria-hidden="true">
                <path d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Dental Oasis</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1" role="list">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-dark-700'
                    }`
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-dark-600">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-white">{admin?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-dark-800 border-b border-dark-600 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <p className="text-sm font-semibold text-white">Dental Oasis Admin</p>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
