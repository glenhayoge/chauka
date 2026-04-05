import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
import ContributionTree from '../components/analytics/ContributionTree'

export default function ContributionPage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { id: resolvedId, isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(resolvedId ?? 0)
  const data = useLogframeStore((s) => s.data)

  if (resolving || isLoading) return <p className="text-sm text-muted">Loading...</p>
  if (notFound) return <p className="text-sm text-destructive">Logframe not found.</p>
  if (error) return <p className="text-sm text-destructive">Failed to load data.</p>
  if (!data) return null

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

      <ContributionTree scores={scores} results={results} />
    </div>
  )
}
