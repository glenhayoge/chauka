import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function Navbar() {
  const isLoggedIn = !!useAuthStore((s) => s.token)

  return (
    <nav className="px-6 py-1 border-b border-border sticky top-0 bg-white z-10">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground py-3">
            Chauka - MEL Information System
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 mr-8">
            <Link to="/#features" className="text-sm text-foreground hover:text-primary">Features</Link>
            <Link to="/#about" className="text-sm text-foreground hover:text-primary">About</Link>
            <Link to="/docs" className="text-sm text-foreground hover:text-primary">Docs</Link>
            <Link to="/help" className="text-sm text-foreground hover:text-primary">Help</Link>
            <Link to="/#contact" className="text-sm text-foreground hover:text-primary">Contact</Link>
          </div>
          {isLoggedIn ? (
            <Link to="/app" className="text-sm text-foreground hover:text-primary">Go to app</Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-foreground hover:text-primary py-3">Sign in</Link>
              <Link to="/register" className="text-sm font-medium text-foreground border border-secondary px-2 sm:py-2 py-2.5 rounded-md hover:bg-secondary/80 transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
