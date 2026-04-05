import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth'

interface Props {
  logframeId: number
  onClose: () => void
}

const STYLES = [
  {
    value: 'donor',
    label: 'Donor-Grade NGO Logframe',
    description: 'Full professional format with hierarchy, indicators, activities, and multi-sheet workbook',
  },
  {
    value: 'expanded',
    label: 'Expanded Logframe',
    description: 'Indicators and assumptions appear as child rows beneath each result',
  },
  {
    value: 'simple',
    label: 'Simple Logframe',
    description: 'Compact single-row per result — good for quick overview',
  },
  {
    value: 'dfat',
    label: 'DFAT Format',
    description: 'Australian DFAT Performance Assessment Framework layout',
  },
  {
    value: 'eu',
    label: 'EU Logical Framework',
    description: 'European Commission intervention logic format (4-column LFA)',
  },
]

export default function ExportDialog({ logframeId, onClose }: Props) {
  const [style, setStyle] = useState('donor')
  const [includeActivities, setIncludeActivities] = useState(true)
  const [includeIndicators, setIncludeIndicators] = useState(true)
  const [includeBudget, setIncludeBudget] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDownload = () => {
    setError('')
    setLoading(true)
    const token = useAuthStore.getState().token
    const params = new URLSearchParams({
      style,
      include_activities: String(includeActivities),
      include_indicators: String(includeIndicators),
      include_budget: String(includeBudget),
      include_summary: String(includeSummary),
    })

    fetch(`/api/logframes/${logframeId}/export/logframe-pro?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed — please try again.')
        const disposition = res.headers.get('Content-Disposition') || ''
        const match = disposition.match(/filename="?([^"]+)"?/)
        const filename = match ? match[1] : 'logframe.xlsx'
        return res.blob().then((blob) => ({ blob, filename }))
      })
      .then(({ blob, filename }) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
        onClose()
      })
      .catch((err) => setError(err.message || 'Export failed.'))
      .finally(() => setLoading(false))
  }

  const options = [
    { key: 'activities', label: 'Activity Plan sheet',      val: includeActivities, set: setIncludeActivities },
    { key: 'indicators', label: 'Indicator Details sheet',  val: includeIndicators, set: setIncludeIndicators },
    { key: 'budget',     label: 'Budget Summary sheet',     val: includeBudget,     set: setIncludeBudget },
    { key: 'summary',    label: 'Project summary block',    val: includeSummary,    set: setIncludeSummary },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Export Logframe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a professional Excel report
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Export style */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Export Style</p>
            <div className="space-y-1.5">
              {STYLES.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-start gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                    style === s.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-style"
                    value={s.value}
                    checked={style === s.value}
                    onChange={() => setStyle(s.value)}
                    className="mt-0.5 shrink-0 accent-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{s.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{s.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Include options */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Include Sections</p>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={opt.val}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-lg shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-background rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Excel
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
