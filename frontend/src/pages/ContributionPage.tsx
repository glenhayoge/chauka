import { useLogframeStore } from '../store/logframe'
import ContributionTree from '../components/analytics/ContributionTree'

export default function ContributionPage() {
  const data = useLogframeStore((s) => s.data)
  const scores = data?.contributionScores ?? []
  const results = data?.results ?? []

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contribution Analysis</h1>
        <p className="text-sm text-muted mt-1">
          See how output-level progress contributes to outcome-level results, weighted by contribution factors.
        </p>
      </div>

      <ContributionTree scores={scores} results={results} />
    </div>
  )
}
