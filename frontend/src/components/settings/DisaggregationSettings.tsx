import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { useLogframeStore } from '../../store/logframe'
import type { DisaggregationCategory } from '../../api/types'

export default function DisaggregationSettings() {
  const logframeId = useLogframeStore((s) => s.data?.logframe?.id)
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const { data: categories = [] } = useQuery<DisaggregationCategory[]>({
    queryKey: ['disaggregation-categories', logframeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/logframes/${logframeId}/disaggregation-categories/`)
      return data
    },
    enabled: !!logframeId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/logframes/${logframeId}/disaggregation-categories/`, { name: newName })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disaggregation-categories', logframeId] })
      setNewName('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/logframes/${logframeId}/disaggregation-categories/${id}`, { name: editName })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disaggregation-categories', logframeId] })
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/logframes/${logframeId}/disaggregation-categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disaggregation-categories', logframeId] })
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Disaggregation Categories</h3>
        <p className="text-xs text-muted mt-1">
          Define categories like Gender, Age Group, or District to tag sub-indicators for automatic breakdown analysis.
        </p>
      </div>

      {/* List */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-3 py-2 border border-border rounded-md">
            {editId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') updateMutation.mutate(cat.id) }}
                />
                <button onClick={() => updateMutation.mutate(cat.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                <button onClick={() => setEditId(null)} className="text-xs text-muted hover:underline">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{cat.name}</span>
                <button
                  onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${cat.name}"? SubIndicators will be unlinked.`)) deleteMutation.mutate(cat.id) }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-muted py-2">No categories defined yet.</p>
        )}
      </div>

      {/* Add new */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate() }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g., Gender, Age Group, District"
          className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!newName.trim() || createMutation.isPending}
          className="px-3 py-1.5 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  )
}
