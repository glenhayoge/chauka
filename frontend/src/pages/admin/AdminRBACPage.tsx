import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoles, getPermissions, createPermission, setRolePermissions } from '../../api/admin'
import clsx from 'clsx'

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Organisation Admin',
  project_lead: 'Project Lead',
  data_collector: 'Data Collector',
  viewer: 'Viewer',
}

export default function AdminRBACPage() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('org_admin')
  const [showAddPerm, setShowAddPerm] = useState(false)
  const [newPerm, setNewPerm] = useState({ codename: '', name: '', description: '', category: 'general' })
  const [error, setError] = useState('')

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-rbac-roles'],
    queryFn: getRoles,
  })

  const { data: permissions, isLoading: permsLoading } = useQuery({
    queryKey: ['admin-rbac-permissions'],
    queryFn: getPermissions,
  })

  const selectedRoleData = roles?.find((r) => r.role === selectedRole)
  const selectedPermissions = new Set(selectedRoleData?.permissions || [])

  const toggleMutation = useMutation({
    mutationFn: (codenames: string[]) => setRolePermissions(selectedRole, codenames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rbac-roles'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createPermission(newPerm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rbac-permissions'] })
      setNewPerm({ codename: '', name: '', description: '', category: 'general' })
      setShowAddPerm(false)
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create permission')
    },
  })

  function handleToggle(codename: string) {
    const next = new Set(selectedPermissions)
    if (next.has(codename)) {
      next.delete(codename)
    } else {
      next.add(codename)
    }
    toggleMutation.mutate(Array.from(next))
  }

  // Group permissions by category
  const grouped: Record<string, typeof permissions> = {}
  if (permissions) {
    for (const perm of permissions) {
      if (!grouped[perm.category]) grouped[perm.category] = []
      grouped[perm.category]!.push(perm)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Roles & Permissions</h1>
        <p className="text-sm text-muted mt-1">
          Configure what each role can do. Permissions enhance the existing RBAC system.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left: Role list */}
        <div className="w-48 flex-shrink-0 space-y-1">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Roles</h2>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={clsx(
                'block w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                selectedRole === role
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-foreground/70 hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: Permissions grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">
              Permissions for <span className="font-semibold">{ROLE_LABELS[selectedRole]}</span>
            </h2>
            <button
              onClick={() => setShowAddPerm(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Permission
            </button>
          </div>

          {(rolesLoading || permsLoading) && (
            <p className="text-sm text-muted">Loading...</p>
          )}

          {permissions && permissions.length === 0 && (
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted">No permissions defined yet.</p>
              <p className="text-xs text-muted/60 mt-1">Add permissions to start configuring role-based access.</p>
            </div>
          )}

          {Object.entries(grouped).map(([category, perms]) => (
            <div key={category} className="mb-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{category}</h3>
              <div className="space-y-1">
                {perms!.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(perm.codename)}
                      onChange={() => handleToggle(perm.codename)}
                      disabled={toggleMutation.isPending}
                      className="rounded border-border"
                    />
                    <div>
                      <span className="text-sm font-medium">{perm.name}</span>
                      <span className="text-xs text-muted ml-2">({perm.codename})</span>
                      {perm.description && (
                        <p className="text-xs text-muted">{perm.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Permission Modal */}
      {showAddPerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold">Add Permission</h3>
              <button onClick={() => setShowAddPerm(false)} className="text-muted hover:text-foreground text-lg">&times;</button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
              className="p-5 space-y-4"
            >
              {error && <p className="text-sm text-red-500">{error}</p>}
              <label className="block">
                <span className="text-xs text-muted">Codename *</span>
                <input
                  type="text"
                  value={newPerm.codename}
                  onChange={(e) => setNewPerm({ ...newPerm, codename: e.target.value })}
                  placeholder="e.g., logframe.edit"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Display Name *</span>
                <input
                  type="text"
                  value={newPerm.name}
                  onChange={(e) => setNewPerm({ ...newPerm, name: e.target.value })}
                  placeholder="e.g., Edit Logframes"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Description</span>
                <input
                  type="text"
                  value={newPerm.description}
                  onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })}
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Category</span>
                <input
                  type="text"
                  value={newPerm.category}
                  onChange={(e) => setNewPerm({ ...newPerm, category: e.target.value })}
                  placeholder="e.g., logframe, org, system"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPerm(false)}
                  className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
