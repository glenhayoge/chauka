import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      {/* Header */}
      <header className="bg-background/95 border-b border-border px-6">
        <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-lg font-semibold hover:text-foreground/80 transition-colors">
              Chauka Admin
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/app"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Back to App
            </Link>
            <Link to="/profile" className="text-sm text-foreground hover:text-foreground/80 hover:underline transition-colors">
              {username}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-foreground hover:text-foreground/80 underline hover:no-underline transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
