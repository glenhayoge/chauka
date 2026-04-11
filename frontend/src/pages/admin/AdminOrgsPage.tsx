import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminOrgs } from '../../api/admin'

export default function AdminOrgsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orgs', page, search],
    queryFn: () => getAdminOrgs({ page, page_size: 25, search: search || undefined }),
  })

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold">Organisation Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.total} organisations` : 'Loading...'}
        </p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search organisations..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-64 rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Slug</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium text-center">Members</th>
              <th className="px-4 py-2.5 font-medium text-center">Logframes</th>
              <th className="px-4 py-2.5 font-medium">Country</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {data?.items.map((org) => (
              <tr key={org.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-2.5 font-medium">{org.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{org.slug}</td>
                <td className="px-4 py-2.5 text-foreground/80">{org.owner_username || `#${org.owner_id}`}</td>
                <td className="px-4 py-2.5 text-center">{org.member_count}</td>
                <td className="px-4 py-2.5 text-center">{org.logframe_count}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{org.country || '-'}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No organisations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
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
    </div>
  )
}
