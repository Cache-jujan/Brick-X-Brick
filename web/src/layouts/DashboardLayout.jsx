import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Receipt,
  FileBarChart, ShieldCheck, Settings,
  LogOut, Bell, Menu,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const GM_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/dashboard' },
  { icon: FolderKanban,    label: 'Projects',    path: '/projects' },
  { icon: Receipt,         label: 'Expenses',    path: '/expenses' },
  { icon: FileBarChart,    label: 'Reports',     path: '/reports' },
  { icon: ShieldCheck,     label: 'Audit Trail', path: '/audit' },
  { icon: Settings,        label: 'Settings',    path: '/admin' },
]

const PM_NAV = [
  { icon: FolderKanban, label: 'Projects', path: '/pm/projects' },
]

export default function DashboardLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    const stored = localStorage.getItem('bxb_user')
    if (!stored) { navigate('/login'); return }
    try { setUser(JSON.parse(stored)) }
    catch { navigate('/login') }
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const isPM     = location.pathname.startsWith('/pm')
  const navItems = isPM ? PM_NAV : GM_NAV

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 18 ? 'Good afternoon' :
    'Good evening'

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#1A1A1A', color: '#F0EDE8' }}>
      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#1A1A1A', borderRight: '1px solid #2E2E2E' }}
        className={[
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 ease-in-out',
          'lg:relative lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6" style={{ borderBottom: '1px solid #2E2E2E' }}>
          <span className="text-2xl mr-2">🧱</span>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            BRICK x BRICK
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => [
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-[#D97B2C]'
                  : 'text-[#9A9590] hover:text-[#F0EDE8]',
              ].join(' ')}
              style={({ isActive }) => isActive ? { backgroundColor: 'rgba(217,123,44,0.1)' } : {}}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4" style={{ borderTop: '1px solid #2E2E2E' }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: '#D97B2C' }}
            >
              {user.initials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs" style={{ color: '#9A9590' }}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ color: '#E84B4B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(232,75,75,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-16 items-center justify-between px-6"
          style={{ borderBottom: '1px solid #2E2E2E', backgroundColor: '#1A1A1A' }}
        >
          <button
            className="lg:hidden"
            style={{ color: '#9A9590' }}
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-6 px-4">
            <div className="hidden lg:block text-sm font-medium" style={{ color: '#9A9590' }}>
              {greeting} 👋
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center text-sm" style={{ color: '#9A9590' }}>
                {today}
              </div>
              <button className="relative" style={{ color: '#9A9590' }}>
                <Bell className="h-6 w-6" />
                <span
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: '#D97B2C' }}
                >
                  3
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#1A1A1A' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}