import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { helpArticles } from './registry'

export default function HelpSearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fuse = useMemo(
    () =>
      new Fuse(helpArticles, {
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'section', weight: 0.2 },
          { name: 'slug', weight: 0.1 },
        ],
        threshold: 0.4,
      }),
    []
  )

  const results = query.length > 0 ? fuse.search(query, { limit: 8 }) : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        ref.current?.querySelector('input')?.focus()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const sectionLabels: Record<string, string> = {
    'getting-started': 'Getting Started',
    features: 'Features',
    concepts: 'Concepts',
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search help articles... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg overflow-hidden">
          {results.map(({ item }) => (
            <li key={item.slug}>
              <button
                onClick={() => {
                  navigate(`/help/${item.slug}`)
                  setQuery('')
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-3"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground w-24 shrink-0">
                  {sectionLabels[item.section] ?? item.section}
                </span>
                <span className="text-foreground">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.length > 0 && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg px-3 py-4 text-sm text-muted-foreground text-center">
          No results for "{query}"
        </div>
      )}
    </div>
  )
}
