import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminUsers } from '../../api/admin'
import type { AdminUser } from '../../api/types'
import UserCreateForm from '../../components/admin/UserCreateForm'
import UserDetailModal from '../../components/admin/UserDetailModal'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, activeFilter],
    queryFn: () => getAdminUsers({ page, page_size: 25, search: search || undefined, is_active: activeFilter }),
  })

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-muted mt-1">
            {data ? `${data.total} users` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors"
        >
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-64 rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
          onChange={(e) => {
            const v = e.target.value
            setActiveFilter(v === 'all' ? undefined : v === 'active')
            setPage(1)
          }}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Users</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-left text-muted">
              <th className="px-4 py-2.5 font-medium">Username</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium text-center">Role</th>
              <th className="px-4 py-2.5 font-medium text-center">Status</th>
              <th className="px-4 py-2.5 font-medium text-center">Orgs</th>
              <th className="px-4 py-2.5 font-medium">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            )}
            {data?.items.map((user) => (
              <tr
                key={user.id}
                onClick={() => setEditUser(user)}
                className="cursor-pointer hover:bg-secondary/20 transition-colors"
              >
                <td className="px-4 py-2.5 font-medium">{user.username}</td>
                <td className="px-4 py-2.5 text-foreground/80">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-4 py-2.5 text-foreground/80">{user.email}</td>
                <td className="px-4 py-2.5 text-center">
                  {user.is_superuser ? (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Super</span>
                  ) : user.is_staff ? (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Staff</span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">User</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {user.is_active ? (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">{user.org_count}</td>
                <td className="px-4 py-2.5 text-muted text-xs">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary/50 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary/50 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && <UserCreateForm onClose={() => setShowCreate(false)} />}
      {editUser && <UserDetailModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  )
}
