import type { ContributionScore, Result } from '../../api/types'

interface Props {
  scores: ContributionScore[]
  results: Result[]
}

export default function ContributionSummaryCard({ scores, results }: Props) {
  if (scores.length === 0) return null

  const resultLookup = Object.fromEntries(results.map((r) => [r.id, r]))

  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Outcome Progress</h3>
      <div className="space-y-3">
        {scores.map((score) => {
          const result = resultLookup[score.result_id]
          if (!result) return null

          const color = score.score >= 70 ? '#16a34a' : score.score >= 40 ? '#f59e0b' : '#dc2626'

          return (
            <div key={score.result_id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate text-foreground/80 mr-2">{result.name}</span>
                <span className="font-semibold flex-shrink-0" style={{ color }}>{score.score}%</span>
              </div>
              <div className="w-full bg-secondary/30 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, score.score)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
