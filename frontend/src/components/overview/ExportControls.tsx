import { useState } from 'react'
import { useAuthStore } from '../../store/auth'
import type { Period, AppSettings } from '../../api/types'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface Props {
  logframeId: string
  periods: Period[]
  settings: AppSettings | null
}

function downloadExport(logframeId: string, path: string) {
  const token = useAuthStore.getState().token
  const url = `/api/logframes/${logframeId}/export/${path}`
  // Use a hidden link with fetch + blob to include auth header
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error('Export failed')
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match ? match[1] : 'export.xlsx'
      return res.blob().then((blob) => ({ blob, filename }))
    })
    .then(({ blob, filename }) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    })
    .catch(() => alert('Export failed. Please try again.'))
}

function formatPeriodLabel(p: Period): string {
  const start = `${MONTHS[p.start_month - 1]} ${p.start_year}`
  const end = `${MONTHS[p.end_month - 1]} ${p.end_year}`
  return `${start} – ${end}`
}

function formatPeriodValue(p: Period): string {
  return `${String(p.start_month).padStart(2, '0')}-${p.start_year}`
}

export default function ExportControls({ logframeId, periods, settings }: Props) {
  const [quarterReportPeriod, setQuarterReportPeriod] = useState('')
  const [annualPlanYear, setAnnualPlanYear] = useState('')
  const [quarterPlanPeriod, setQuarterPlanPeriod] = useState('')

  // Build year options from settings
  const years: number[] = []
  if (settings) {
    for (let y = settings.start_year; y <= settings.end_year; y++) {
      years.push(y)
    }
  }

  return (
    <div className="mt-6 p-4 bg-muted border border-border rounded-lg">
      <h3 className="text-sm font-semibold text-foreground mb-3">Export</h3>
      <div className="flex flex-wrap gap-4">
        {/* Quarterly Report */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Quarterly report</label>
          <select
            value={quarterReportPeriod}
            onChange={(e) => setQuarterReportPeriod(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select period</option>
            {periods.map((p) => (
              <option key={p.id} value={formatPeriodValue(p)}>
                {formatPeriodLabel(p)}
              </option>
            ))}
          </select>
          <button
            disabled={!quarterReportPeriod}
            onClick={() =>
              downloadExport(logframeId, `quarterly-report?period=${quarterReportPeriod}`)
            }
            className="px-3 py-1 text-sm rounded bg-primary text-background hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>

        {/* Annual Plan */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Annual plan</label>
          <select
            value={annualPlanYear}
            onChange={(e) => setAnnualPlanYear(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            disabled={!annualPlanYear}
            onClick={() =>
              downloadExport(logframeId, `annual-plan?year=${annualPlanYear}`)
            }
            className="px-3 py-1 text-sm rounded bg-primary text-background hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>

        {/* Quarterly Plan */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Quarterly plan</label>
          <select
            value={quarterPlanPeriod}
            onChange={(e) => setQuarterPlanPeriod(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select period</option>
            {periods.map((p) => (
              <option key={p.id} value={formatPeriodValue(p)}>
                {formatPeriodLabel(p)}
              </option>
            ))}
          </select>
          <button
            disabled={!quarterPlanPeriod}
            onClick={() =>
              downloadExport(logframeId, `quarterly-plan?period=${quarterPlanPeriod}`)
            }
            className="px-3 py-1 text-sm rounded bg-primary text-background hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
