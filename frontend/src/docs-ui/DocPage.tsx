import { useParams, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { getDocComponent, docs, getDocsForSection } from './registry'
import { mdxComponents } from './mdx-components'

export default function DocPage() {
  const { '*': slug } = useParams()
  if (!slug) return <NotFound />

  const entry = docs.find((d) => d.slug === slug)
  if (!entry) return <NotFound />

  const Component = getDocComponent(slug)
  if (!Component) return <NotFound />

  const sectionDocs = getDocsForSection(entry.section)
  const idx = sectionDocs.findIndex((d) => d.slug === slug)
  const prev = idx > 0 ? sectionDocs[idx - 1] : null
  const next = idx < sectionDocs.length - 1 ? sectionDocs[idx + 1] : null

  return (
    <MDXProvider components={mdxComponents}>
      <Component />
      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
        {prev ? (
          <Link to={`/docs/${prev.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            &larr; {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/docs/${next.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            {next.title} &rarr;
          </Link>
        ) : <span />}
      </div>
    </MDXProvider>
  )
}

function NotFound() {
  return (
    <div className="py-12 text-center">
      <p className="text-lg font-semibold text-foreground mb-2">Page not found</p>
      <p className="text-sm text-muted-foreground mb-4">
        The documentation page you're looking for doesn't exist.
      </p>
      <Link to="/docs" className="text-sm text-primary hover:underline">
        Back to docs
      </Link>
    </div>
  )
}
