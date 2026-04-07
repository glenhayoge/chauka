import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLibrarySectors } from '../../api/indicatorLibrary'
import type { LibraryIndicator } from '../../api/types'

const RESULT_LEVELS = [
  { value: 'impact', label: 'Impact' },
  { value: 'outcome', label: 'Outcome' },
  { value: 'output', label: 'Output' },
  { value: 'activity', label: 'Activity' },
]

const inputClass =
  'w-full border border-border rounded-[var(--radius)] px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'

const labelClass = 'block text-sm text-muted-foreground mb-1'

interface Props {
  organisationId: number
  initial?: Partial<LibraryIndicator>
  onSubmit: (data: Record<string, string | number>) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export default function LibraryIndicatorForm({ organisationId, initial, onSubmit, onCancel, saving }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sector, setSector] = useState(initial?.sector ?? '')
  const [resultLevel, setResultLevel] = useState(initial?.result_level ?? '')
  const [definition, setDefinition] = useState(initial?.definition ?? '')
  const [unitOfMeasure, setUnitOfMeasure] = useState(initial?.unit_of_measure ?? '')
  const [calculationMethod, setCalculationMethod] = useState(initial?.calculation_method ?? '')
  const [dataSource, setDataSource] = useState(initial?.data_source ?? '')
  const [dataCollectionMethod, setDataCollectionMethod] = useState(initial?.data_collection_method ?? '')
  const [reportingFrequency, setReportingFrequency] = useState(initial?.reporting_frequency ?? '')
  const [disaggregationFields, setDisaggregationFields] = useState(initial?.disaggregation_fields ?? '')
  const [framework, setFramework] = useState(initial?.framework ?? 'Custom')
  const [frameworkCode, setFrameworkCode] = useState(initial?.framework_code ?? '')
  const [error, setError] = useState('')

  const { data: sectors } = useQuery({
    queryKey: ['library-sectors'],
    queryFn: getLibrarySectors,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    try {
      await onSubmit({
        organisation_id: organisationId,
        name: name.trim(),
        sector,
        result_level: resultLevel,
        definition: definition.trim(),
        unit_of_measure: unitOfMeasure.trim(),
        calculation_method: calculationMethod.trim(),
        data_source: dataSource.trim(),
        data_collection_method: dataCollectionMethod.trim(),
        reporting_frequency: reportingFrequency,
        disaggregation_fields: disaggregationFields.trim(),
        framework: framework || 'Custom',
        framework_code: frameworkCode.trim(),
      })
    } catch {
      setError('Failed to save indicator')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Indicator name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Sector</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)}
            className={inputClass}>
            <option value="">Select sector</option>
            {sectors?.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Result level</label>
          <select value={resultLevel} onChange={(e) => setResultLevel(e.target.value)}
            className={inputClass}>
            <option value="">Select level</option>
            {RESULT_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Reporting frequency</label>
          <select value={reportingFrequency} onChange={(e) => setReportingFrequency(e.target.value)}
            className={inputClass}>
            <option value="">Select frequency</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Semi-annual">Semi-annual</option>
            <option value="Annual">Annual</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Definition</label>
        <textarea value={definition} onChange={(e) => setDefinition(e.target.value)}
          className={inputClass + ' min-h-[80px]'} rows={3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Unit of measure</label>
          <input type="text" value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)}
            className={inputClass} placeholder="e.g. Percentage, Number, USD" />
        </div>
        <div>
          <label className={labelClass}>Data source</label>
          <input type="text" value={dataSource} onChange={(e) => setDataSource(e.target.value)}
            className={inputClass} placeholder="e.g. Household survey" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Calculation method</label>
          <input type="text" value={calculationMethod} onChange={(e) => setCalculationMethod(e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Data collection method</label>
          <input type="text" value={dataCollectionMethod} onChange={(e) => setDataCollectionMethod(e.target.value)}
            className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Disaggregation fields</label>
        <input type="text" value={disaggregationFields} onChange={(e) => setDisaggregationFields(e.target.value)}
          className={inputClass} placeholder="e.g. Gender, Age, Location" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Framework</label>
          <input type="text" value={framework} onChange={(e) => setFramework(e.target.value)}
            className={inputClass} placeholder="e.g. Custom, SDG, IFAD" />
        </div>
        <div>
          <label className={labelClass}>Framework code</label>
          <input type="text" value={frameworkCode} onChange={(e) => setFrameworkCode(e.target.value)}
            className={inputClass} placeholder="e.g. SDG 2.1.1" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving || !name.trim()}
          className="px-4 py-1.5 bg-foreground text-background text-sm rounded-[var(--radius)] hover:bg-foreground/80 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : initial ? 'Update indicator' : 'Create indicator'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-1.5 border border-border text-sm rounded-[var(--radius)] hover:bg-muted transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
