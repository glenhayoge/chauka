import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
import { apiClient } from '../api/client'
import DisaggregationChart from '../components/analytics/DisaggregationChart'

export default function DisaggregationPage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(publicId ?? "")
  const data = useLogframeStore((s) => s.data)

  const categories = data?.disaggregationCategories ?? []
  const columns = data?.columns ?? []

  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [columnId, setColumnId] = useState<number | null>(null)
  const [metric, setMetric] = useState<'total' | 'average'>('total')

  // Set initial category when categories load
  useEffect(() => {
    if (categories.length > 0 && categoryId === null) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const logframeId = data?.logframe?.public_id

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['disaggregation-breakdown', logframeId, categoryId, columnId],
    queryFn: async () => {
      const params: Record<string, any> = { category_id: categoryId }
      if (columnId) params.column_id = columnId
      const { data } = await apiClient.get(`/logframes/${logframeId}/analytics/disaggregation`, { params })
      return data
    },
    enabled: !!logframeId && !!categoryId,
  })

  if (resolving || isLoading) return <p className="text-sm text-muted">Loading...</p>
  if (notFound) return <p className="text-sm text-destructive">Logframe not found.</p>
  if (error) return <p className="text-sm text-destructive">Failed to load data.</p>
  if (!data) return null

  if (categories.length === 0) {
    return (

      <div className="max-w-2xl">
        <div className='px-12'>
          <h1 className="text-xl font-semibold">Disaggregation Analysis</h1>
          <div className="mt-6 border border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-sm text-muted">No disaggregation categories defined.</p>
            <p className="text-xs text-muted/60 mt-1">
              Go to Settings &gt; Disaggregation to create categories like Gender, Age Group, or District, then tag sub-indicators with values.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Disaggregation Analysis</h1>
        <p className="text-sm text-foreground/50 mt-1">View indicator data broken down by disaggregation categories.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={columnId ?? ''}
          onChange={(e) => setColumnId(e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All measurements</option>
          {columns.map((col) => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
        </select>

        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as 'total' | 'average')}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="total">Total</option>
          <option value="average">Average</option>
        </select>
      </div>

      {/* Chart */}
      {breakdownLoading && <p className="text-sm text-muted">Loading breakdown...</p>}
      {breakdown && (
        <DisaggregationChart
          category={breakdown.category}
          groups={breakdown.groups}
          metric={metric}
        />
      )}
    </div>
  )
}
