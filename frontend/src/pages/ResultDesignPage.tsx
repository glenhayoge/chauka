import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { apiClient } from '../api/client'
import TabNav from '../components/layout/TabNav'
import IndicatorEditor from '../components/design/IndicatorEditor'
import AssumptionEditor from '../components/design/AssumptionEditor'
import EditableText from '../components/ui/EditableText'
import EditableSelect from '../components/ui/EditableSelect'
import EditableNumber from '../components/ui/EditableNumber'
import RichTextEditor from '../components/ui/RichTextEditor'
import AddButton from '../components/ui/AddButton'

export default function ResultDesignPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)
  const [searchParams] = useSearchParams()
  const filterResultId = searchParams.get('result')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  const results = filterResultId
    ? data.results.filter((r) => r.id === Number(filterResultId))
    : data.results

  const result = filterResultId ? results[0] : null
  const canEdit = data.canEdit

  // Single-result editor view
  if (result) {
    const resultId = result.id
    const indicators = data.indicators.filter((i) => i.result_id === resultId)
    const assumptions = data.assumptions.filter((a) => a.result_id === resultId)
    const resultBase = `/logframes/${id}/results/${resultId}`

    async function saveResultField(field: string, value: unknown) {
      await apiClient.patch(resultBase, { [field]: value })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', id] })
    }

    async function addIndicator() {
      await apiClient.post(`${resultBase}/indicators/`, {
        name: '',
        description: '',
        source_of_verification: '',
        result_id: resultId,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', id] })
    }

    async function deleteResult() {
      await apiClient.delete(resultBase)
      queryClient.invalidateQueries({ queryKey: ['bootstrap', id] })
      navigate(`/logframes/${id}/design`)
    }

    const riskRatingOptions = data.riskRatings.map((r) => ({ value: r.id, label: r.name }))
    const levelLabel = result.level ? data.levels[String(result.level)] : 'Result'

    return (
      <div>
        <TabNav />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            to={`/logframes/${id}/design`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; All results
          </Link>
          <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 font-medium">
            {levelLabel}
          </span>
        </div>

        {/* Result fields */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
            <EditableText
              value={result.name}
              onSave={(v) => saveResultField('name', v)}
              placeholder="Result name"
              className="text-lg font-semibold block mt-1"
              disabled={!canEdit}
            />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
            <div className="mt-1">
              <RichTextEditor
                value={result.description}
                onSave={(v) => saveResultField('description', v)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {riskRatingOptions.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Rating</label>
                <div className="mt-1">
                  <EditableSelect
                    value={result.rating_id}
                    options={riskRatingOptions}
                    onSave={(v) => saveResultField('rating_id', v === null ? null : Number(v))}
                    placeholder="Select risk rating"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contribution Weighting</label>
              <div className="mt-1">
                <EditableNumber
                  value={result.contribution_weighting}
                  onSave={(v) => saveResultField('contribution_weighting', v ?? 100)}
                  disabled={!canEdit}
                />
                <span className="text-xs text-gray-400 ml-1">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Indicators ({indicators.length})
          </h3>
          {indicators.map((indicator) => (
            <IndicatorEditor
              key={indicator.id}
              indicator={indicator}
              logframeId={id}
              periods={data.periods}
              targets={data.targets ?? []}
            />
          ))}
          {canEdit && <AddButton onClick={addIndicator} label="Add indicator" />}
        </div>

        {/* Assumptions section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Assumptions ({assumptions.length})
          </h3>
          <AssumptionEditor
            assumptions={assumptions}
            riskRatings={data.riskRatings}
            resultId={result.id}
            logframeId={id}
            canEdit={canEdit}
          />
        </div>

        {/* Delete result */}
        {canEdit && (
          <div className="border-t pt-4 mt-8">
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete this result
            </button>
            <ConfirmDialog
              open={confirmDelete}
              title="Delete Result"
              description="This will permanently delete this result and all its indicators, assumptions, and activities. This action cannot be undone."
              confirmText="Delete Result"
              onConfirm={deleteResult}
              onCancel={() => setConfirmDelete(false)}
            />
          </div>
        )}
      </div>
    )
  }

  // All-results list view (no ?result= param)
  return (
    <div>
      <TabNav />
      <h2 className="text-lg font-semibold mb-4">Result Design</h2>
      {results.map((r) => {
        const indicators = data.indicators.filter((i) => i.result_id === r.id)
        const levelLabel = r.level ? data.levels[String(r.level)] : ''
        return (
          <div key={r.id} className="mb-4 border rounded-lg p-3 bg-white hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-2">
              {levelLabel && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 font-medium">{levelLabel}</span>
              )}
              <Link
                to={`/logframes/${id}/design?result=${r.id}`}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                {r.name || '(unnamed result)'}
              </Link>
              <span className="text-xs text-gray-400">{indicators.length} indicator{indicators.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
