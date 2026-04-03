import { Suspense, useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'
import TableOfContents from './TableOfContents'

export default function DocsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[90rem] mx-auto px-4 py-3">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <Link to="/docs" className="text-sm font-semibold text-foreground whitespace-nowrap py-3">
              Chauka Docs
            </Link>
            {/* Search — hidden on mobile, shown on sm+ */}
            <div className="hidden sm:block flex-1">
              <SearchBar />
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden ml-auto p-2 -mr-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {/* Search — mobile only, full width below title */}
          <div className="sm:hidden mt-2">
            <SearchBar />
          </div>
        </div>
      </header>

      <div className="max-w-[90rem] mx-auto flex flex-1 w-full">
        {/* Left sidebar */}
        <aside
          className={`
            ${mobileOpen ? 'block' : 'hidden'} lg:block
            w-64 shrink-0 border-r border-border overflow-y-auto
            fixed lg:sticky top-[57px] bottom-0 left-0 z-20
            bg-background lg:bg-transparent p-4
            lg:h-[calc(100vh-57px)]
          `}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-10 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-10" data-docs-content>
          <div className="max-w-3xl">
            <Suspense fallback={<div className="text-sm text-muted-foreground py-8">Loading...</div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Right TOC */}
        <aside className="hidden xl:block w-56 shrink-0 py-8 pr-4">
          <div className="sticky top-[80px]">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  )
}
