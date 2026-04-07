import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function UserMenu() {
  const { username, isStaff, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  const initial = username ? username[0].toUpperCase() : '?'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1 text-sm">
          {/* Username header */}
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="font-medium text-foreground truncate">{username}</p>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-foreground hover:bg-foreground/6 transition-colors"
          >
            Profile
          </Link>

          {isStaff && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-foreground hover:bg-foreground/6 transition-colors"
            >
              Admin
            </Link>
          )}

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-foreground hover:bg-foreground/6 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
