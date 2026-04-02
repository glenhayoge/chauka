import { useState } from 'react'

interface Props {
  label: string
  value: string
  onSave: (value: string) => Promise<void>
  canEdit: boolean
}

export default function EditableField({ label, value, onSave, canEdit }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setEditing(false)
    if (draft !== value && draft.trim()) {
      setSaving(true)
      try {
        await onSave(draft.trim())
      } finally {
        setSaving(false)
      }
    } else {
      setDraft(value)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') { setDraft(value); setEditing(false) }
          }}
          className="w-full border border-blue-400 rounded px-3 py-1.5 text-sm focus:outline-none"
        />
      ) : (
        <div
          onClick={() => canEdit && setEditing(true)}
          className={`text-sm px-3 py-1.5 rounded ${
            canEdit ? 'cursor-pointer hover:bg-yellow-50 active:bg-yellow-100' : ''
          } ${saving ? 'text-gray-400' : 'text-gray-800'} ${
            !value ? 'text-gray-400 italic' : ''
          }`}
        >
          {value || 'Click to edit'}
        </div>
      )}
    </div>
  )
}
