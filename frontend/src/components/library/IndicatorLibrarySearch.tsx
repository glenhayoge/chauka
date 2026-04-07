import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchLibraryIndicators, getLibrarySectors } from '../../api/indicatorLibrary'
import type { LibraryIndicator } from '../../api/types'
import IndicatorLibraryDetail from './IndicatorLibraryDetail'

const RESULT_LEVELS = [
  { value: 'impact', label: 'Impact' },
  { value: 'outcome', label: 'Outcome' },
  { value: 'output', label: 'Output' },
  { value: 'activity', label: 'Activity' },
]

const FRAMEWORKS = ['SDG', 'FAO', 'IFAD', 'USAID', 'World Bank', 'Custom']

const selectClass =
  'border border-border rounded-[var(--radius)] px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

interface Props {
  organisationId: number | null
  initialSector?: string
  onSelect?: (indicator: LibraryIndicator) => void
  selectable?: boolean
}

export default function IndicatorLibrarySearch({ organisationId, initialSector, onSelect, selectable }: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sector, setSector] = useState(initialSector ?? '')
  const [resultLevel, setResultLevel] = useState('')
  const [framework, setFramework] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [sector, resultLevel, framework])

  const { data: sectors } = useQuery({
    queryKey: ['library-sectors'],
    queryFn: getLibrarySectors,
  })

  const { data: results, isLoading } = useQuery({
    queryKey: ['library-indicators', debouncedQuery, sector, resultLevel, framework, organisationId, page],
    queryFn: () =>
      searchLibraryIndicators({
        q: debouncedQuery || undefined,
        sector: sector || undefined,
        result_level: resultLevel || undefined,
        framework: framework || undefined,
        organisation_id: organisationId ?? undefined,
        page,
        page_size: 25,
      }),
  })

  const totalPages = results ? Math.ceil(results.total / results.page_size) : 0

  function handleRowClick(indicator: LibraryIndicator) {
    if (selectable && onSelect) {
      onSelect(indicator)
    } else {
      setExpandedId(expandedId === indicator.id ? null : indicator.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indicators..."
          className="flex-1 border border-border rounded-[var(--radius)] px-3 py-1.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectClass}>
          <option value="">All sectors</option>
          {sectors?.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select value={resultLevel} onChange={(e) => setResultLevel(e.target.value)} className={selectClass}>
          <option value="">All levels</option>
          {RESULT_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <select value={framework} onChange={(e) => setFramework(e.target.value)} className={selectClass}>
          <option value="">All frameworks</option>
          {FRAMEWORKS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {isLoading && <p className="text-sm text-muted-foreground">Searching...</p>}

      {results && results.items.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No indicators found.</p>
      )}

      {results && results.items.length > 0 && (
        <div className="border border-border rounded-[var(--radius)] divide-y divide-border">
          {results.items.map((indicator) => (
            <div key={indicator.id}>
              <button
                onClick={() => handleRowClick(indicator)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{indicator.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {indicator.framework_code && <span>{indicator.framework_code}</span>}
                      {indicator.sector && (
                        <>
                          {indicator.framework_code && <span className="text-muted-foreground/40">·</span>}
                          <span>{indicator.sector}</span>
                        </>
                      )}
                      {indicator.result_level && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="capitalize">{indicator.result_level}</span>
                        </>
                      )}
                      {indicator.unit_of_measure && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{indicator.unit_of_measure}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {indicator.organisation_id && (
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">Custom</span>
                    )}
                    {selectable ? (
                      <span className="text-xs text-primary">Select</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{expandedId === indicator.id ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {!selectable && expandedId === indicator.id && (
                <div className="px-4 pb-4 border-t border-border bg-muted/20">
                  <div className="pt-3">
                    <IndicatorLibraryDetail indicator={indicator} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {results!.total} result{results!.total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1 border border-border rounded-[var(--radius)] text-sm disabled:opacity-40 hover:bg-muted"
            >
              Prev
            </button>
            <span className="text-muted-foreground text-xs">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1 border border-border rounded-[var(--radius)] text-sm disabled:opacity-40 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
