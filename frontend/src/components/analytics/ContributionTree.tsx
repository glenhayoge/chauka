import type { ContributionScore, Result } from '../../api/types'

interface Props {
  scores: ContributionScore[]
  results: Result[]
}

function getColor(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#f59e0b'
  return '#dc2626'
}

function getColorClass(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-300'
  if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

export default function ContributionTree({ scores, results }: Props) {
  const resultLookup = Object.fromEntries(results.map((r) => [r.id, r]))

  if (scores.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center">
        <p className="text-sm text-muted">No contribution data available.</p>
        <p className="text-xs text-muted/60 mt-1">Enable contribution analysis in logframe settings and ensure indicators have targets and actual data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {scores.map((score) => {
        const parentResult = resultLookup[score.result_id]
        if (!parentResult) return null

        return (
          <div key={score.result_id} className="border border-border rounded-lg overflow-hidden">
            {/* Parent (Outcome) */}
            <div className="px-4 py-3 bg-secondary/20 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{parentResult.name}</p>
                <p className="text-xs text-muted">Level {parentResult.level} result</p>
              </div>
              <div className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${getColorClass(score.score)}`}>
                {score.score}%
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2">
              <div className="w-full bg-secondary/30 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, score.score)}%`, backgroundColor: getColor(score.score) }}
                />
              </div>
            </div>

            {/* Children (Outputs) */}
            <div className="px-4 pb-3 space-y-2">
              {score.children.map((child) => {
                const childResult = resultLookup[child.result_id]
                return (
                  <div key={child.result_id} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-foreground/80">{childResult?.name || child.name}</p>
                    </div>
                    <span className="text-xs text-muted flex-shrink-0 w-16 text-right">
                      Weight: {child.weight}
                    </span>
                    <div className="w-24 bg-secondary/30 rounded-full h-1.5 flex-shrink-0">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, child.progress)}%`, backgroundColor: getColor(child.progress) }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right flex-shrink-0" style={{ color: getColor(child.progress) }}>
                      {child.progress}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
