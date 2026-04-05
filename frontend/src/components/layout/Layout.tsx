import { useState } from 'react'
import { Outlet, useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth'
import { useLogframeStore } from '../../store/logframe'
import { getLogframes } from '../../api/logframes'
import clsx from 'clsx'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()
  const { logframeId } = useParams<{ logframeId: string }>()
  const { pathname } = useLocation()
  const currentData = useLogframeStore((s) => s.data)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: logframes } = useQuery({
    queryKey: ['logframes'],
    queryFn: getLogframes,
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleLogframeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value
    if (newId) navigate(`/app/logframes/${newId}`)
  }

  const currentLogframeId = logframeId ? Number(logframeId) : null
  const logframeName = currentData?.logframe?.name
    ?? logframes?.find((lf) => lf.id === currentLogframeId)?.name

  return (
    <div className="min-h-screen text-foreground">
      {/* Top header bar */}
      <div className='max-w-7xl mx-auto'>
        <header className="text-foreground bg-background/95 px-6">
          <div className="px-3 sm:px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <Link to="/app" className="text-lg sm:text-xl font-semibold hover:text-foreground/80 transition-colors py-3 flex-shrink-0">
                Chauka
              </Link>

              {/* Logframe switcher — only when inside a logframe context */}
              {currentLogframeId && logframes && logframes.length > 1 && (
                <select
                  value={currentLogframeId ?? ''}
                  onChange={handleLogframeChange}
                  className="hidden sm:block bg-foreground/80 text-background text-sm rounded-md px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
                >
                  <option value="" disabled>Select logframe</option>
                  {logframes.map((lf) => (
                    <option key={lf.id} value={lf.id}>{lf.name}</option>
                  ))}
                </select>
              )}

              {/* Single logframe name display */}
              {currentLogframeId && logframes && logframes.length === 1 && logframeName && (
                <span className="text-sm text-foreground/80 truncate hidden sm:inline">{logframeName}</span>
              )}
            </div>

            {/* Desktop user controls */}
            <div className="hidden sm:flex items-center gap-4">
              {useAuthStore((s) => s.isStaff) && (
                <Link to="/admin" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
              <NotificationBell />
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

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 -mr-2 text-foreground/80 hover:text-background transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu drawer */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-border px-4 py-3 space-y-3">
              {/* Logframe switcher — only when inside a logframe context */}
              {currentLogframeId && logframes && logframes.length > 1 && (
                <select
                  value={currentLogframeId ?? ''}
                  onChange={(e) => { handleLogframeChange(e); setMobileMenuOpen(false) }}
                  className="w-full bg-secondary/80 text-foreground text-sm rounded-md px-2 py-2 border border-border focus:outline-none"
                >
                  <option value="" disabled>Select logframe</option>
                  {logframes.map((lf) => (
                    <option key={lf.id} value={lf.id}>{lf.name}</option>
                  ))}
                </select>
              )}

              {/* Dashboard nav links */}
              {currentLogframeId && (
                <div className="flex flex-col gap-1 px-0">
                  <MobileNavLink
                    to={`/app/logframes/${currentLogframeId}`}
                    active={pathname === `/app/logframes/${currentLogframeId}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink
                    to={`/app/logframes/${currentLogframeId}/people`}
                    active={pathname.startsWith(`/app/logframes/${currentLogframeId}/people`)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    People
                  </MobileNavLink>
                  <MobileNavLink
                    to={`/app/logframes/${currentLogframeId}/settings`}
                    active={pathname.startsWith(`/app/logframes/${currentLogframeId}/settings`)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </MobileNavLink>
                </div>
              )}

              {/* User info + logout */}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-foreground">
                  <NotificationBell />
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-foreground py-3 hover:text-background hover:underline transition-colors"
                  >
                    {username}
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-foreground hover:text-background underline hover:no-underline transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}

          {/* Desktop dashboard nav bar */}
          {currentLogframeId && (
            <nav className="hidden sm:flex px-3 gap-1 bg-background/95 border-0 border">
              <NavButton
                to={`/app/logframes/${currentLogframeId}`}
                active={pathname === `/app/logframes/${currentLogframeId}`}
              >
                Dashboard
              </NavButton>
              <NavButton
                to={`/app/logframes/${currentLogframeId}/people`}
                active={pathname.startsWith(`/app/logframes/${currentLogframeId}/people`)}
              >
                People
              </NavButton>
              <NavButton
                to={`/app/logframes/${currentLogframeId}/settings`}
                active={pathname.startsWith(`/app/logframes/${currentLogframeId}/settings`)}
              >
                Settings
              </NavButton>
            </nav>
          )}
        </header>
      </div>
      <main className="flex-1 p-3 sm:p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>

    </div>
  )
}

function NavButton({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={clsx(
        'px-4 py-2 text-sm font-medium rounded-t transition-colors',
        active
          ? 'bg-secondary/95 text-secondary-foreground'
          : 'text-foreground-muted hover:text-foreground/80 hover:bg-secondary/95'
      )}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ to, active, onClick, children }: { to: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-secondary/95 text-secondary-foreground'
          : 'text-foreground-muted hover:text-foreground/80 hover:bg-secondary/95'
      )}
    >
      {children}
    </Link>
  )
}
