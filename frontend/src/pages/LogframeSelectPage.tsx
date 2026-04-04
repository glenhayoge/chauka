import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { getLogframes } from '../api/logframes'

export default function LogframeSelectPage() {
  const { data: logframes, isLoading, error } = useQuery({
    queryKey: ['logframes'],
    queryFn: getLogframes,
  })

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">Failed to load logframes.</p>

  // Auto-redirect if single logframe
  if (logframes?.length === 1) {
    return <Navigate to={`/app/logframes/${logframes[0].id}`} replace />
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Select a Logframe</h2>
      <div className="grid gap-3 max-w-md">
        {logframes?.map((lf) => (
          <Link
            key={lf.id}
            to={`/app/logframes/${lf.id}`}
            className="block border rounded-lg p-4 hover:border-ring hover:shadow-sm transition-shadow"
          >
            <span className="font-medium">{lf.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
