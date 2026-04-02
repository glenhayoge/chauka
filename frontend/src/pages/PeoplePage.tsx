import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import PeoplePanel from '../components/settings/PeoplePanel'

export default function PeoplePage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">People</h2>
      <PeoplePanel logframeId={id} canEdit={data.canEdit} />
    </div>
  )
}
