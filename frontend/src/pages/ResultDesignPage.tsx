import { useState, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
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
import UseFromLibraryDialog from '../components/library/UseFromLibraryDialog'
import { buildResultCodeMap } from '../utils/resultCodes'

export default function ResultDesignPage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(publicId ?? '')
  const data = useLogframeStore((s) => s.data)
  const [searchParams] = useSearchParams()
  const filterResultId = searchParams.get('result')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false)

  if (resolving) return <p className="text-muted-foreground">Loading…</p>
  if (notFound) return <p className="text-destructive">Logframe not found.</p>
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">Failed to load data.</p>
  if (!data) return null

  const results = filterResultId
    ? data.results.filter((r) => r.id === Number(filterResultId))
    : data.results

  const result = filterResultId ? results[0] : null
  const canEdit = data.canEdit
  const resultCodes = useMemo(() => buildResultCodeMap(data.results), [data.results])

  // Single-result editor view
  if (result) {
    const resultId = result.id
    const indicators = data.indicators.filter((i) => i.result_id === resultId)
    const assumptions = data.assumptions.filter((a) => a.result_id === resultId)
    const resultBase = `/logframes/${publicId!}/results/${resultId}`

    async function saveResultField(field: string, value: unknown) {
      await apiClient.patch(resultBase, { [field]: value })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', publicId!] })
    }

    async function addIndicator() {
      await apiClient.post(`${resultBase}/indicators/`, {
        name: '',
        description: '',
        source_of_verification: '',
        result_id: resultId,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', publicId!] })
    }

    async function deleteResult() {
      await apiClient.delete(resultBase)
      queryClient.invalidateQueries({ queryKey: ['bootstrap', publicId!] })
      navigate(`/app/logframes/${publicId}/design`)
    }

    const riskRatingOptions = data.riskRatings.map((r) => ({ value: r.id, label: r.name }))
    const levelLabel = result.level ? data.levels[String(result.level)] : 'Result'
    const code = resultCodes.get(result.id) ?? ''

    return (
      <div>
        <TabNav />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            to={`/app/logframes/${publicId}/design`}
            className="text-sm text-primary hover:text-primary/80"
          >
            &larr; All results
          </Link>
          <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5 font-medium">
            {code && <span className="mr-1">{code}</span>}{levelLabel}
          </span>
        </div>

        {/* Result fields */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="mb-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</label>
            <EditableText
              value={result.name}
              onSave={(v) => saveResultField('name', v)}
              placeholder="Result name"
              className="text-lg font-semibold block mt-1"
              disabled={!canEdit}
            />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Rating</label>
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contribution Weighting</label>
              <div className="mt-1">
                <EditableNumber
                  value={result.contribution_weighting}
                  onSave={(v) => saveResultField('contribution_weighting', v ?? 100)}
                  disabled={!canEdit}
                />
                <span className="text-xs text-muted-foreground ml-1">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
            Indicators ({indicators.length})
          </h3>
          {indicators.map((indicator) => (
            <IndicatorEditor
              key={indicator.id}
              indicator={indicator}
              logframeId={publicId!}
              periods={data.periods}
              targets={data.targets ?? []}
            />
          ))}
          {canEdit && (
            <div className="flex items-center gap-3">
              <AddButton onClick={addIndicator} label="Add indicator" />
              <button
                onClick={() => setLibraryDialogOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Browse indicator library
              </button>
            </div>
          )}
          {libraryDialogOpen && (
            <UseFromLibraryDialog
              logframePublicId={publicId!}
              resultId={resultId}
              organisationId={data.orgContext?.organisation?.id ?? null}
              onClose={() => setLibraryDialogOpen(false)}
            />
          )}
        </div>

        {/* Assumptions section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
            Assumptions ({assumptions.length})
          </h3>
          <AssumptionEditor
            assumptions={assumptions}
            riskRatings={data.riskRatings}
            resultId={result.id}
            logframeId={publicId!}
            canEdit={canEdit}
          />
        </div>

        {/* Delete result */}
        {canEdit && (
          <div className="border-t pt-4 mt-8">
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-destructive hover:text-destructive/80"
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
        const code = resultCodes.get(r.id) ?? ''
        return (
          <div key={r.id} className="mb-4 border rounded-lg p-3 bg-card hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2">
              {levelLabel && (
                <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5 font-medium">
                  {code && <span className="mr-1">{code}</span>}{levelLabel}
                </span>
              )}
              <Link
                to={`/app/logframes/${publicId}/design?result=${r.id}`}
                className="font-medium text-primary hover:text-primary/80"
              >
                {r.name || '(unnamed result)'}
              </Link>
              <span className="text-xs text-muted-foreground">{indicators.length} indicator{indicators.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
