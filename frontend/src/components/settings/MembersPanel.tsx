import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMembers, addMember, removeMember, updateMemberRole,
  getInvitations, createInvitation, revokeInvitation,
} from '../../api/organisations'
import { getUsers, searchUsers } from '../../api/logframes'
import type { OrganisationMembership, OrgRole, Invitation, UserSummary } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import clsx from 'clsx'

interface Props {
  canEdit: boolean
  userRole: string | null
  orgId?: number
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-purple-50 text-purple-700' },
  member: { label: 'Member', color: 'bg-muted text-foreground' },
}

export default function MembersPanel({ canEdit: _canEdit, userRole, orgId: orgIdProp }: Props) {
  const data = useLogframeStore((s) => s.data)
  const queryClient = useQueryClient()
  const [addRole, setAddRole] = useState<OrgRole>('member')
  const [error, setError] = useState<string | null>(null)

  // Use explicit orgId prop if provided, otherwise derive from logframe context
  const logframe = data?.logframe
  const projectId = logframe?.project_id

  // Fallback: traverse orgs to find orgId (only when orgIdProp not provided)
  const { data: orgContext } = useQuery({
    queryKey: ['project-org-context', projectId],
    queryFn: async () => {
      if (!projectId) return null
      const { data: orgs } = await (await import('../../api/client')).apiClient.get('/organisations/')
      for (const org of orgs) {
        const { data: programs } = await (await import('../../api/client')).apiClient.get(
          `/organisations/${org.id}/programs/`
        )
        for (const prog of programs) {
          const { data: projects } = await (await import('../../api/client')).apiClient.get(
            `/organisations/${org.id}/programs/${prog.id}/projects/`
          )
          const found = projects.find((p: { id: number }) => p.id === projectId)
          if (found) {
            return { orgId: org.id, programId: prog.id, projectId: found.id }
          }
        }
      }
      return null
    },
    enabled: !orgIdProp && !!projectId,
    staleTime: 60_000,
  })

  const orgId = orgIdProp ?? orgContext?.orgId

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getMembers(orgId!),
    enabled: !!orgId,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  if (!orgIdProp && !projectId) {
    return (
      <p className="text-sm text-muted-foreground italic">
        This logframe is not linked to an organisation. Member management is only
        available for organisation-linked logframes.
      </p>
    )
  }

  if (membersLoading || (!orgIdProp && !orgContext)) {
    return <p className="text-muted-foreground text-sm">Loading members...</p>
  }

  const isAdmin = userRole === 'admin'

  function getDisplayName(userId: number): string {
    const user = users?.find((u) => u.id === userId)
    if (!user) return `User #${userId}`
    if (user.first_name || user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim()
    }
    return user.username
  }

  function getUsername(userId: number): string {
    return users?.find((u) => u.id === userId)?.username ?? ''
  }

  const memberList = Array.isArray(members) ? members : []
  const memberUserIds = new Set(memberList.map((m) => m.user_id))

  async function handleRemove(membershipId: number) {
    if (!orgId) return
    await removeMember(orgId, membershipId)
    queryClient.invalidateQueries({ queryKey: ['org-members', orgId] })
  }

  async function handleRoleChange(membership: OrganisationMembership, newRole: OrgRole) {
    if (!orgId) return
    await updateMemberRole(orgId, membership.id, {
      user_id: membership.user_id,
      role: newRole,
    })
    queryClient.invalidateQueries({ queryKey: ['org-members', orgId] })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Organisation Members
        </h3>

        {/* Invite by email */}
        {isAdmin && orgId && (
          <InviteSection orgId={orgId} />
        )}

        {/* Members table */}
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
                {isAdmin && (
                  <th className="border border-border px-3 py-2 text-center font-medium text-muted-foreground w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {memberList.map((m) => (
                <tr key={m.id} className="hover:bg-muted">
                  <td className="border border-border px-3 py-2 font-medium text-foreground">
                    {getDisplayName(m.user_id)}
                  </td>
                  <td className="border border-border px-3 py-2 text-muted-foreground">
                    {getUsername(m.user_id)}
                  </td>
                  <td className="border border-border px-3 py-2 text-center">
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value as OrgRole)}
                        className="text-xs border border-border rounded px-2 py-1"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </td>
                  {isAdmin && (
                    <td className="border border-border px-3 py-2 text-center">
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {memberList.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="border border-border px-3 py-4 text-center text-muted-foreground italic"
                  >
                    No members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add member by search */}
        {isAdmin && (
          <UserSearchAdd
            orgId={orgId!}
            addRole={addRole}
            setAddRole={setAddRole}
            memberUserIds={memberUserIds}
            onAdded={() => queryClient.invalidateQueries({ queryKey: ['org-members', orgId] })}
            error={error}
            setError={setError}
          />
        )}
      </div>
    </div>
  )
}

function UserSearchAdd({ orgId, addRole, setAddRole, memberUserIds, onAdded, error, setError }: {
  orgId: number
  addRole: OrgRole
  setAddRole: (r: OrgRole) => void
  memberUserIds: Set<number>
  onAdded: () => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)

  async function handleSearch() {
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      const users = await searchUsers(query.trim())
      setResults(users.filter((u) => !memberUserIds.has(u.id)))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(userId: number) {
    setAdding(true)
    setError(null)
    try {
      await addMember(orgId, { user_id: userId, role: addRole })
      setResults((prev) => prev.filter((u) => u.id !== userId))
      onAdded()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  function displayName(u: UserSummary): string {
    if (u.first_name || u.last_name) return `${u.first_name} ${u.last_name}`.trim()
    return u.username
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add Member</p>
      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
          placeholder="Search by username or email..."
          className="flex-1 text-sm border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={addRole}
          onChange={(e) => setAddRole(e.target.value as OrgRole)}
          className="text-sm border border-border rounded px-2 py-1.5"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={query.trim().length < 2 || searching}
          className="text-sm px-3 py-1.5 bg-primary text-background rounded hover:bg-primary/80 disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {results.length > 0 && (
        <div className="mt-2 border rounded max-w-md">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0">
              <div>
                <span className="font-medium">{displayName(u)}</span>
                <span className="text-muted-foreground ml-2">{u.username}</span>
              </div>
              <button
                onClick={() => handleAdd(u.id)}
                disabled={adding}
                className="text-xs px-2 py-1 bg-primary text-background rounded hover:bg-primary/80 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
      {results.length === 0 && query.length >= 2 && !searching && (
        <p className="text-xs text-muted-foreground mt-2">No users found. Try inviting them by email above.</p>
      )}
    </div>
  )
}

function InviteSection({ orgId }: { orgId: number }) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [sending, setSending] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const { data: invitations } = useQuery({
    queryKey: ['invitations', orgId],
    queryFn: () => getInvitations(orgId),
  })

  const pending = (invitations ?? []).filter((i: Invitation) => !i.accepted)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setInviteError('')
    try {
      await createInvitation(orgId, { email: email.trim(), role })
      setEmail('')
      setRole('member')
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setInviteError(msg || 'Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  async function handleRevoke(invitationId: number) {
    await revokeInvitation(orgId, invitationId)
    queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
  }

  function copyLink(invite: Invitation) {
    const url = `${window.location.origin}/invite/${invite.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="mb-4 p-3 bg-accent border border-primary/20 rounded-lg">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Invite by Email
      </h4>
      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
          className="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-border rounded px-2 py-1.5 text-sm"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={sending || !email.trim()}
          className="px-4 py-1.5 bg-primary text-background text-sm rounded hover:bg-primary/80 disabled:opacity-50 whitespace-nowrap"
        >
          {sending ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
      {inviteError && <p className="text-xs text-destructive mt-1">{inviteError}</p>}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Pending Invitations</p>
          <div className="space-y-1">
            {pending.map((inv: Invitation) => (
              <div key={inv.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-card rounded px-2 py-1.5">
                <span className="flex-1 truncate">{inv.email}</span>
                <span className="text-muted-foreground">{inv.role}</span>
                <button
                  onClick={() => copyLink(inv)}
                  className="text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  {copiedId === inv.id ? 'Copied!' : 'Copy link'}
                </button>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="text-destructive hover:text-destructive/80"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_LABELS[role] ?? { label: role, color: 'bg-muted text-muted-foreground' }
  return (
    <span
      className={clsx(
        'inline-block text-xs font-medium px-2 py-0.5 rounded',
        config.color
      )}
    >
      {config.label}
    </span>
  )
}
