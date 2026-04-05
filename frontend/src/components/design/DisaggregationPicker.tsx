import { useLogframeStore } from '../../store/logframe'

interface Props {
  categoryId: number | null
  value: string
  onChange: (categoryId: number | null, value: string) => void
}

export default function DisaggregationPicker({ categoryId, value, onChange }: Props) {
  const categories = useLogframeStore((s) => s.data?.disaggregationCategories ?? [])

  if (categories.length === 0) return null

  return (
    <div className="flex items-center gap-2 mt-1">
      <select
        value={categoryId ?? ''}
        onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : null
          onChange(id, value)
        }}
        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">No disaggregation</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {categoryId && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(categoryId, e.target.value)}
          placeholder="e.g., Female, 15-24, Nairobi"
          className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-32"
        />
      )}
    </div>
  )
}
