import { useParams, Link } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
import type {
  BootstrapData,
  Result,
  Indicator,
  Activity,
  BudgetLine,
  SubIndicator,
  Target,
} from '../api/types'

export default function PrintLogframePage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(publicId ?? "")
  const data = useLogframeStore((s) => s.data)

  if (resolving) return <p className="text-muted-foreground p-6">Loading logframe data...</p>
  if (notFound) return <p className="text-destructive p-6">Logframe not found.</p>
  if (isLoading) return <p className="text-muted-foreground p-6">Loading logframe data...</p>
  if (error) return <p className="text-destructive p-6">Failed to load logframe data.</p>
  if (!data) return null

  return (
    <div className="print-page">
      {/* Screen-only toolbar */}
      <div className="print-toolbar print-hide">
        <Link
          to={`/app/logframes/${publicId}`}
          className="text-sm text-primary hover:text-primary/80 underline"
        >
          &larr; Back to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="ml-4 px-4 py-2 bg-primary text-background text-sm font-medium rounded hover:bg-primary/80"
        >
          Print
        </button>
      </div>

      {/* Header */}
      <PrintHeader data={data} />

      {/* Results hierarchy */}
      <ResultsSection data={data} />

      {/* Footer */}
      <div className="print-footer">
        <p>
          Printed on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

/* ---------- Header ---------- */

function PrintHeader({ data }: { data: BootstrapData }) {
  const { logframe, settings, orgContext } = data
  return (
    <div className="print-header">
      <h1 className="print-title">{logframe.name}</h1>
      <dl className="print-meta">
        {orgContext?.organisation && (
          <MetaItem label="Organisation" value={orgContext.organisation.name} />
        )}
        {orgContext?.program && (
          <MetaItem label="Program" value={orgContext.program.name} />
        )}
        {orgContext?.project && (
          <MetaItem label="Project" value={orgContext.project.name} />
        )}
        {settings && (
          <>
            <MetaItem
              label="Period"
              value={
                settings.start_year === settings.end_year
                  ? String(settings.start_year)
                  : `${settings.start_year} \u2013 ${settings.end_year}`
              }
            />
            <MetaItem label="Currency" value={settings.currency} />
          </>
        )}
      </dl>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-meta-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/* ---------- Results hierarchy ---------- */

function ResultsSection({ data }: { data: BootstrapData }) {
  const { results, levels } = data

  // Build tree: top-level results have parent_id === null
  const topLevel = results
    .filter((r) => r.parent_id === null)
    .sort((a, b) => a.order - b.order)

  if (topLevel.length === 0) {
    return <p className="print-empty">No results defined.</p>
  }

  return (
    <div className="print-results">
      {topLevel.map((result) => (
        <ResultBlock key={result.id} result={result} data={data} levels={levels} depth={0} />
      ))}
    </div>
  )
}

function ResultBlock({
  result,
  data,
  levels,
  depth,
}: {
  result: Result
  data: BootstrapData
  levels: Record<string, string>
  depth: number
}) {
  const levelLabel = result.level != null ? levels[String(result.level)] ?? `Level ${result.level}` : null
  const children = data.results.filter((r) => r.parent_id === result.id).sort((a, b) => a.order - b.order)
  const indicators = data.indicators.filter((i) => i.result_id === result.id).sort((a, b) => a.order - b.order)
  const activities = data.activities.filter((a) => a.result_id === result.id).sort((a, b) => a.order - b.order)
  const assumptions = data.assumptions.filter((a) => a.result_id === result.id)
  const rating = result.rating_id ? data.ratings.find((r) => r.id === result.rating_id) : null

  return (
    <div className={`print-result print-result-depth-${Math.min(depth, 3)}`}>
      <div className="print-result-header">
        {levelLabel && <span className="print-level-badge">{levelLabel}</span>}
        <h2 className="print-result-name">{result.name}</h2>
        {rating && (
          <span className="print-rating" style={{ backgroundColor: rating.color || '#e5e7eb' }}>
            {rating.name}
          </span>
        )}
      </div>

      {result.description && (
        <div
          className="print-result-desc"
          dangerouslySetInnerHTML={{ __html: result.description }}
        />
      )}

      {/* Indicators */}
      {indicators.length > 0 && (
        <div className="print-section">
          <h3 className="print-section-title">Indicators</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Source of Verification</th>
                <th>Baseline</th>
                <th>Targets</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind) => (
                <IndicatorRow key={ind.id} indicator={ind} data={data} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <div className="print-section">
          <h3 className="print-section-title">Activities</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Start</th>
                <th>End</th>
                <th>Deliverables</th>
                <th className="print-number-col">Budget</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <ActivityRow key={act.id} activity={act} budgetLines={data.budgetLines} settings={data.settings} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assumptions */}
      {assumptions.length > 0 && (
        <div className="print-section">
          <h3 className="print-section-title">Assumptions</h3>
          <ul className="print-assumption-list">
            {assumptions.map((a) => {
              const risk = a.risk_rating_id
                ? data.riskRatings.find((rr) => rr.id === a.risk_rating_id)
                : null
              return (
                <li key={a.id} className="print-assumption">
                  <span dangerouslySetInnerHTML={{ __html: a.description }} />
                  {risk && <span className="print-risk-badge">{risk.name}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Child results */}
      {children.map((child) => (
        <ResultBlock key={child.id} result={child} data={data} levels={levels} depth={depth + 1} />
      ))}
    </div>
  )
}

/* ---------- Indicator row ---------- */

function IndicatorRow({ indicator, data }: { indicator: Indicator; data: BootstrapData }) {
  const subIndicators = (data.subIndicators ?? []).filter(
    (si: SubIndicator) => si.indicator_id === indicator.id
  )
  const targets = (data.targets ?? []).filter(
    (t: Target) => t.indicator_id === indicator.id
  )

  // Build a readable targets summary
  const targetSummary = targets
    .filter((t) => t.value != null && t.value !== '')
    .map((t) => {
      const si = subIndicators.find((s) => s.id === t.subindicator_id)
      const label = si ? si.name : ''
      return label ? `${label}: ${t.value}` : t.value
    })
    .join('; ')

  return (
    <tr>
      <td>
        <div className="font-medium">{indicator.name}</div>
        {indicator.description && (
          <div className="text-xs text-muted-foreground mt-0.5">{indicator.description}</div>
        )}
        {subIndicators.length > 0 && (
          <div className="text-xs text-muted-foreground mt-0.5">
            Components: {subIndicators.map((s) => s.name).join(', ')}
          </div>
        )}
      </td>
      <td>{indicator.source_of_verification || '\u2014'}</td>
      <td>{indicator.needs_baseline ? 'Required' : '\u2014'}</td>
      <td>{targetSummary || '\u2014'}</td>
    </tr>
  )
}

/* ---------- Activity row ---------- */

function ActivityRow({
  activity,
  budgetLines,
  settings,
}: {
  activity: Activity
  budgetLines: BudgetLine[]
  settings: BootstrapData['settings']
}) {
  const lines = budgetLines.filter((bl) => bl.activity_id === activity.id)
  const total = lines.reduce((sum, bl) => sum + (bl.amount ?? 0), 0)
  const currency = settings?.currency ?? ''

  const formatDate = (d: string | null) => {
    if (!d) return '\u2014'
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return d
    }
  }

  return (
    <tr>
      <td>
        <div className="font-medium">{activity.name}</div>
        {activity.description && (
          <div
            className="text-xs text-muted-foreground mt-0.5"
            dangerouslySetInnerHTML={{ __html: activity.description }}
          />
        )}
      </td>
      <td className="whitespace-nowrap">{formatDate(activity.start_date)}</td>
      <td className="whitespace-nowrap">{formatDate(activity.end_date)}</td>
      <td>{activity.deliverables || '\u2014'}</td>
      <td className="print-number-col">
        {total > 0
          ? `${currency} ${total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '\u2014'}
        {lines.length > 1 && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {lines.map((l) => `${l.name}: ${currency} ${l.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`).join('; ')}
          </div>
        )}
      </td>
    </tr>
  )
}
