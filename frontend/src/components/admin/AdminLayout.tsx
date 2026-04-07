import { Outlet, Link } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import UserMenu from '../layout/UserMenu'

export default function AdminLayout() {
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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to App
            </Link>
            <UserMenu />
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
