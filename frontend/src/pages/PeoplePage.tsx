import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
import PeoplePanel from '../components/settings/PeoplePanel'

export default function PeoplePage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { id: resolvedId, isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(resolvedId ?? 0)
  const data = useLogframeStore((s) => s.data)

  if (resolving) return <p className="text-muted-foreground">Loading…</p>
  if (notFound) return <p className="text-destructive">Logframe not found.</p>
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">Failed to load data.</p>
  if (!data) return null

  return (
    <div>
      {/* <h2 className="text-lg font-semibold mb-4">People</h2> */}
      <PeoplePanel logframeId={resolvedId!} canEdit={data.canEdit} />
    </div>
  )
}
