import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLogframeStore } from '../../store/logframe'
import { getUsers } from '../../api/logframes'
import { getMembers } from '../../api/organisations'
import { apiClient } from '../../api/client'
import type { UserSummary, Activity } from '../../api/types'
import EditableSelect from '../ui/EditableSelect'
import clsx from 'clsx'

interface Props {
  logframeId: string
  canEdit: boolean
}

export default function PeoplePanel({ logframeId, canEdit }: Props) {
  const data = useLogframeStore((s) => s.data)
  const queryClient = useQueryClient()

  const orgId = data?.orgContext?.organisation.id

  // Fetch org members (scoped to this organisation)
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getMembers(orgId!),
    enabled: !!orgId,
  })

  // Fetch user details for display names
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const isLoading = membersLoading
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!data) return null

  // If no org context, fall back to showing nothing meaningful
  if (!orgId || !members) {
    return <p className="text-sm text-muted-foreground italic">No team members yet. Invite people from Settings.</p>
  }

  const activities = data.activities

  // Only show users who are members of this organisation
  if (members && !Array.isArray(members)) {
    console.warn('API returned non-array for members:', members)
  }
  const memberList = Array.isArray(members) ? members : []
  const memberUserIds = new Set(memberList.map((m) => m.user_id))
  const teamUsers: UserSummary[] = (allUsers ?? []).filter((u) => memberUserIds.has(u.id))

  function getDisplayName(user: UserSummary): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim()
    }
    return user.username
  }

  function getUserActivities(userId: number): Activity[] {
    return activities.filter((a) => a.lead_id === userId)
  }

  function getMemberRole(userId: number): string {
    const membership = memberList.find((m) => m.user_id === userId)
    return membership?.role ?? 'member'
  }

  const unassignedActivities = activities.filter((a) => a.lead_id === null)

  const userOptions = teamUsers.map((u) => ({
    value: u.id,
    label: getDisplayName(u),
  }))

  async function assignLead(activity: Activity, leadId: number | null) {
    await apiClient.patch(
      `/logframes/${logframeId}/results/${activity.result_id}/activities/${activity.id}`,
      { lead_id: leadId },
    )
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  if (teamUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm mb-2">No team members yet.</p>
        <p className="text-muted-foreground text-xs">
          Invite people to your organisation from{' '}
          <a href={`/app/logframes/${logframeId}/settings?tab=members`} className="text-primary hover:underline">
            Settings &rarr; Members
          </a>
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Team members table */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-3 py-2 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="border border-border px-3 py-2 text-left font-medium text-muted-foreground">
                Username
              </th>
              <th className="border border-border px-3 py-2 text-center font-medium text-muted-foreground">
                Role
              </th>
              <th className="border border-border px-3 py-2 text-center font-medium text-muted-foreground">
                Activities
              </th>
            </tr>
          </thead>
          <tbody>
            {teamUsers.map((user) => {
              const userActivities = getUserActivities(user.id)
              const role = getMemberRole(user.id)
              return (
                <UserRow
                  key={user.id}
                  user={user}
                  displayName={getDisplayName(user)}
                  activityCount={userActivities.length}
                  activities={userActivities}
                  role={role}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Unassigned activities */}
      {unassignedActivities.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
            Unassigned Activities ({unassignedActivities.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-3 py-2 text-left font-medium text-muted-foreground">
                    Activity
                  </th>
                  <th className="border border-border px-3 py-2 text-left font-medium text-muted-foreground w-48">
                    Assign Lead
                  </th>
                </tr>
              </thead>
              <tbody>
                {unassignedActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-muted">
                    <td className="border border-border px-3 py-2 text-foreground">
                      {activity.name || <span className="text-muted-foreground italic">(unnamed)</span>}
                    </td>
                    <td className="border border-border px-3 py-2">
                      <EditableSelect
                        value={null}
                        options={userOptions}
                        onSave={(v) => assignLead(activity, v === null ? null : Number(v))}
                        placeholder="Select lead"
                        disabled={!canEdit}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activities.length === 0 && (
        <p className="text-muted-foreground text-sm italic mt-4">
          No activities in this logframe yet.
        </p>
      )}
    </div>
  )
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: 'bg-purple-50 text-purple-700',
  member: 'bg-accent text-primary',
}

const ROLE_BADGE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
}

interface UserRowProps {
  user: UserSummary
  displayName: string
  activityCount: number
  activities: Activity[]
  role: string
}

function UserRow({ user, displayName, activityCount, activities, role }: UserRowProps) {
  const badgeStyle = ROLE_BADGE_STYLES[role] ?? ROLE_BADGE_STYLES.member
  const badgeLabel = ROLE_BADGE_LABELS[role] ?? role

  return (
    <>
      <tr className="hover:bg-muted">
        <td className="border border-border px-3 py-2 font-medium text-foreground">
          {displayName}
        </td>
        <td className="border border-border px-3 py-2 text-muted-foreground">
          {user.username}
        </td>
        <td className="border border-border px-3 py-2 text-center">
          <span className={clsx('inline-block text-xs font-medium px-2 py-0.5 rounded', badgeStyle)}>
            {badgeLabel}
          </span>
        </td>
        <td className="border border-border px-3 py-2 text-center">
          {activityCount > 0 ? (
            <span className="text-primary font-medium">{activityCount}</span>
          ) : (
            <span className="text-muted-foreground">0</span>
          )}
        </td>
      </tr>
      {activityCount > 0 && (
        <tr>
          <td colSpan={4} className="border border-border px-3 py-1 bg-muted">
            <div className="flex flex-wrap gap-2 py-1">
              {activities.map((a) => (
                <span
                  key={a.id}
                  className="text-xs bg-card border border-border rounded px-2 py-1 text-muted-foreground"
                >
                  {a.name || '(unnamed)'}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
