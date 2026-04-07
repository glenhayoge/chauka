import type { LibraryIndicator } from '../../api/types'

interface Props {
  indicator: LibraryIndicator
}

const FIELD_LABELS: { key: keyof LibraryIndicator; label: string }[] = [
  { key: 'definition', label: 'Definition' },
  { key: 'unit_of_measure', label: 'Unit of measure' },
  { key: 'calculation_method', label: 'Calculation method' },
  { key: 'data_source', label: 'Data source' },
  { key: 'data_collection_method', label: 'Data collection method' },
  { key: 'reporting_frequency', label: 'Reporting frequency' },
  { key: 'disaggregation_fields', label: 'Disaggregation' },
]

export default function IndicatorLibraryDetail({ indicator }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {indicator.framework && <span className="border border-border rounded-[var(--radius)] px-1.5 py-0.5">{indicator.framework}</span>}
        {indicator.framework_code && <span className="border border-border rounded-[var(--radius)] px-1.5 py-0.5">{indicator.framework_code}</span>}
        {indicator.sector && <span>{indicator.sector}</span>}
        {indicator.result_level && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="capitalize">{indicator.result_level}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {FIELD_LABELS.map(({ key, label }) => {
          const value = indicator[key]
          if (!value || (typeof value === 'string' && !value.trim())) return null
          return (
            <div key={key}>
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{String(value)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
