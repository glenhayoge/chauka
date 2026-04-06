import { useState } from 'react'
import type { Activity } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import { useUIStore } from '../../store/ui'
import EditableText from '../ui/EditableText'
import EditableDate from '../ui/EditableDate'
import ConfirmDialog from '../ui/ConfirmDialog'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import ActivityDetail from './ActivityDetail'

interface Props {
  activity: Activity
  logframeId: string
  activityCode?: string
}

export default function ActivityRow({ activity, logframeId, activityCode }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit
  const expanded = useUIStore((s) => s.expandedActivities.has(activity.id))
  const toggleActivity = useUIStore((s) => s.toggleActivity)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const activityBase = `/logframes/${logframeId}/results/${activity.result_id}/activities/${activity.id}`

  async function saveField(field: string, value: unknown) {
    await apiClient.patch(activityBase, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function deleteActivity() {
    await apiClient.delete(activityBase)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div>
      {/* Activity header row — matches result row layout */}
      <div className="flex items-center gap-2 px-2 py-2.5">
        <button
          onClick={() => toggleActivity(activity.id)}
          className="text-muted-foreground hover:text-foreground w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm"
          aria-label={expanded ? 'Collapse activity' : 'Expand activity'}
        >
          {expanded ? '\u25BC' : '\u25B6'}
        </button>

        <span className="text-xs font-bold text-amber-600 whitespace-nowrap hidden sm:inline min-w-[70px]">
          {activityCode && <span className="text-muted-foreground font-semibold mr-1">{activityCode}</span>}
          Activity
        </span>

        {/* Activity name */}
        <div className="flex-1 min-w-0">
          <EditableText
            value={activity.name}
            onSave={(v) => saveField('name', v)}
            placeholder="Activity name"
            className="text-sm font-semibold text-foreground"
            disabled={!canEdit}
          />
        </div>

        {/* Activity dates — hidden on mobile, shown below */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <EditableDate
            value={activity.start_date}
            onSave={(v) => saveField('start_date', v)}
            max={activity.end_date}
            placeholder="Start"
            disabled={!canEdit}
          />
          <span>–</span>
          <EditableDate
            value={activity.end_date}
            onSave={(v) => saveField('end_date', v)}
            min={activity.start_date}
            placeholder="End"
            disabled={!canEdit}
          />
        </div>

        {/* Delete button */}
        {canEdit && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-muted-foreground hover:text-destructive flex-shrink-0 text-sm px-1"
            title="Delete activity"
          >
            ×
          </button>
        )}
      </div>

      {/* Mobile dates row */}
      <div className="flex sm:hidden items-center gap-1 text-xs text-muted-foreground px-2 pb-2" style={{ paddingLeft: '2.5rem' }}>
        <span className="text-xs font-bold text-amber-600 mr-1">
          {activityCode && <span className="text-muted-foreground font-semibold mr-1">{activityCode}</span>}
          Activity
        </span>
        <EditableDate
          value={activity.start_date}
          onSave={(v) => saveField('start_date', v)}
          max={activity.end_date}
          placeholder="Start"
          disabled={!canEdit}
        />
        <span>–</span>
        <EditableDate
          value={activity.end_date}
          onSave={(v) => saveField('end_date', v)}
          min={activity.start_date}
          placeholder="End"
          disabled={!canEdit}
        />
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Activity"
        description={`Delete "${activity.name || 'this activity'}"? This will also remove all associated budget lines, resources, milestones, and status updates.`}
        confirmText="Delete"
        onConfirm={deleteActivity}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Expanded detail: TA lines, Budget, Status History */}
      {expanded && (
        <ActivityDetail
          activity={activity}
          logframeId={logframeId}
        />
      )}
    </div>
  )
}
