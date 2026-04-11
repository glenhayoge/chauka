import { useLogframeStore } from '../../store/logframe'
import type { FormulaConfig } from '../../api/types'

interface Props {
  formulaConfig: FormulaConfig | null
  indicatorId: number
  onChange: (config: FormulaConfig | null) => void
}

export default function FormulaEditor({ formulaConfig, indicatorId, onChange }: Props) {
  const indicators = useLogframeStore((s) => s.data?.indicators ?? [])
  const otherIndicators = indicators.filter((i) => i.id !== indicatorId)

  const config = formulaConfig ?? { type: 'progress' as const }

  function updateField(field: string, value: any) {
    onChange({ ...config, [field]: value } as FormulaConfig)
  }

  return (
    <div className="mt-2 p-3 border border-dashed border-border rounded-md space-y-3 bg-secondary/10">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Formula Type</span>
        <select
          value={config.type}
          onChange={(e) => onChange({ type: e.target.value as FormulaConfig['type'] })}
          className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="progress">Progress (actual / target)</option>
          <option value="percentage">Percentage (A / B x 100)</option>
          <option value="aggregation">Aggregate sub-indicators</option>
          <option value="cross_aggregation">Cross-indicator aggregation</option>
        </select>
      </div>

      {config.type === 'percentage' && (
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-muted-foreground">Numerator indicator</span>
            <select
              value={config.numerator_indicator_id ?? ''}
              onChange={(e) => updateField('numerator_indicator_id', Number(e.target.value) || undefined)}
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="">Select...</option>
              {otherIndicators.map((i) => (
                <option key={i.id} value={i.id}>{i.name || `Indicator #${i.id}`}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Denominator indicator</span>
            <select
              value={config.denominator_indicator_id ?? ''}
              onChange={(e) => updateField('denominator_indicator_id', Number(e.target.value) || undefined)}
              className="mt-1 block w-full rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="">Select...</option>
              {otherIndicators.map((i) => (
                <option key={i.id} value={i.id}>{i.name || `Indicator #${i.id}`}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {config.type === 'progress' && (
        <p className="text-xs text-muted-foreground">
          Computes (actual value / target value) x 100 for each sub-indicator and measurement column.
        </p>
      )}

      {(config.type === 'aggregation' || config.type === 'cross_aggregation') && (
        <label className="block">
          <span className="text-xs text-muted-foreground">Aggregation method</span>
          <select
            value={config.method ?? 'sum'}
            onChange={(e) => updateField('method', e.target.value)}
            className="mt-1 block w-full rounded border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="sum">Sum</option>
            <option value="average">Average</option>
            <option value="min">Minimum</option>
            <option value="max">Maximum</option>
          </select>
        </label>
      )}

      {config.type === 'cross_aggregation' && (
        <div>
          <span className="text-xs text-muted-foreground">Source indicators</span>
          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
            {otherIndicators.map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={(config.source_indicator_ids ?? []).includes(i.id)}
                  onChange={(e) => {
                    const current = config.source_indicator_ids ?? []
                    const next = e.target.checked
                      ? [...current, i.id]
                      : current.filter((id) => id !== i.id)
                    updateField('source_indicator_ids', next)
                  }}
                  className="rounded border-border"
                />
                {i.name || `Indicator #${i.id}`}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
