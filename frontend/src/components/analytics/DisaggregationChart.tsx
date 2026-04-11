import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DisaggregationGroup {
  value: string
  total: number
  count: number
  average: number
}

interface Props {
  category: string
  groups: DisaggregationGroup[]
  metric?: 'total' | 'average'
}

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#ec4899']

export default function DisaggregationChart({ category, groups, metric = 'total' }: Props) {
  if (groups.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center">
        <p className="text-sm text-foreground/50">No data available for this category.</p>
      </div>
    )
  }

  const dataKey = metric === 'average' ? 'average' : 'total'

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={groups} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="value" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar
            dataKey={dataKey}
            name={metric === 'average' ? 'Average' : 'Total'}
            fill={COLORS[0]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-left text-muted-foreground">
            <th className="px-4 py-2 font-medium">{category}</th>
            <th className="px-4 py-2 font-medium text-right">Total</th>
            <th className="px-4 py-2 font-medium text-right">Count</th>
            <th className="px-4 py-2 font-medium text-right">Average</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {groups.map((g, i) => (
            <tr key={g.value}>
              <td className="px-4 py-2 font-medium">
                <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {g.value}
              </td>
              <td className="px-4 py-2 text-right">{g.total.toLocaleString()}</td>
              <td className="px-4 py-2 text-right">{g.count}</td>
              <td className="px-4 py-2 text-right">{g.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
