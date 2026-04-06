import { useParams, Link } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
import ContributionTree from '../components/analytics/ContributionTree'

export default function ContributionPage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(publicId ?? "")
  const data = useLogframeStore((s) => s.data)

  if (resolving || isLoading) return <p className="text-sm text-muted">Loading...</p>
  if (notFound) return <p className="text-sm text-destructive">Logframe not found.</p>
  if (error) return <p className="text-sm text-destructive">Failed to load data.</p>
  if (!data) return null

  const enabled = data.settings?.contribution_analysis_enabled ?? false
  const scores = data.contributionScores ?? []
  const results = data.results ?? []

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contribution Analysis</h1>
        <p className="text-sm text-foreground/50 mt-1">
          See how output-level progress contributes to outcome-level results, weighted by contribution factors.
        </p>
      </div>

      {!enabled ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-sm text-foreground/60 font-medium">Contribution analysis is not enabled.</p>
          <p className="text-xs text-foreground/40 mt-1 mb-4">
            Turn it on in logframe settings, then ensure results have indicators with targets and actual data entered.
          </p>
          {data.canEdit && (
            <Link
              to={`/app/logframes/${publicId}/settings`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Go to Settings →
            </Link>
          )}
        </div>
      ) : (
        <ContributionTree scores={scores} results={results} />
      )}
    </div>
  )
}
