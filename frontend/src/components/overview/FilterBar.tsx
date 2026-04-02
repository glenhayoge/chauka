import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../../api/logframes'
import { useUIStore } from '../../store/ui'

export default function FilterBar() {
  const filters = useUIStore((s) => s.filters)
  const setFilter = useUIStore((s) => s.setFilter)
  const clearFilters = useUIStore((s) => s.clearFilters)

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const hasFilters = filters.dateFrom || filters.dateTo || filters.leadId !== null

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <label className="flex items-center gap-1.5 text-sm text-gray-700">
        From
        <input
          type="date"
          value={filters.dateFrom}
          max={filters.dateTo || undefined}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </label>

      <label className="flex items-center gap-1.5 text-sm text-gray-700">
        To
        <input
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </label>

      <label className="flex items-center gap-1.5 text-sm text-gray-700">
        Lead
        <select
          value={filters.leadId ?? ''}
          onChange={(e) =>
            setFilter('leadId', e.target.value ? Number(e.target.value) : null)
          }
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">All</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name || u.last_name
                ? `${u.first_name} ${u.last_name}`.trim()
                : u.username}
            </option>
          ))}
        </select>
      </label>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
