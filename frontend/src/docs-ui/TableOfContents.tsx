import { useState, useEffect } from 'react'
import clsx from 'clsx'

interface Heading {
  id: string
  text: string
  level: number
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    // Small delay to let MDX content render
    const timer = setTimeout(() => {
      const article = document.querySelector('[data-docs-content]')
      if (!article) return
      const els = article.querySelectorAll('h2, h3')
      const items: Heading[] = Array.from(els)
        .filter((el) => el.id)
        .map((el) => ({
          id: el.id,
          text: el.textContent || '',
          level: parseInt(el.tagName[1]),
        }))
      setHeadings(items)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={clsx(
            'block text-sm py-0.5 transition-colors border-l-2',
            h.level === 2 ? 'pl-3' : 'pl-5',
            activeId === h.id
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {h.text}
        </a>
      ))}
    </nav>
  )
}
