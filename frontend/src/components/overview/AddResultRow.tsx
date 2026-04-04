import { useState } from 'react'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  logframeId: number
  parentId?: number | null
  depth?: number
}

export default function AddResultRow({ logframeId, parentId = null, depth = 0 }: Props) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setEditing(false)
      setName('')
      return
    }
    setSaving(true)
    try {
      await apiClient.post(`/logframes/${logframeId}/results/`, {
        name: trimmed,
        parent_id: parentId,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
      setName('')
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div
        className="border-b border-border py-2 bg-warning/10"
        style={{ paddingLeft: `${depth * 1.5 + 2.5}rem` }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') { setName(''); setEditing(false) }
          }}
          placeholder="Enter result name"
          className="border border-ring rounded px-2 py-1 text-sm w-72"
          disabled={saving}
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="border-b border-border py-2 text-muted-foreground italic text-sm cursor-pointer hover:bg-muted"
      style={{ paddingLeft: `${depth * 1.5 + 2.5}rem` }}
    >
      + Click to add {parentId ? 'child result' : 'title'}
    </div>
  )
}
