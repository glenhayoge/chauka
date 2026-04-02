import { useState } from 'react'
import clsx from 'clsx'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import SaveIndicator from './SaveIndicator'

interface Option {
  value: string | number
  label: string
}

interface Props {
  value: string | number | null
  options: Option[]
  onSave: (value: string | number | null) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
}

export default function EditableSelect({ value, options, onSave, placeholder, disabled }: Props) {
  const [editing, setEditing] = useState(false)
  const { state, errorMsg, wrap } = useSaveFeedback()

  const label = options.find((o) => o.value === value)?.label ?? placeholder ?? '\u2014'

  if (editing) {
    return (
      <select
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          wrap(() => onSave(v === '' ? null : v))
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
        autoFocus
        className="border border-blue-400 rounded px-1 py-0.5"
      >
        <option value="">{'\u2014'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span
        onClick={() => !disabled && setEditing(true)}
        className={clsx(
          'rounded px-1 transition-colors duration-300',
          !disabled && 'cursor-pointer hover:bg-yellow-50',
          disabled && 'cursor-default',
          state === 'saving' && 'animate-pulse border border-blue-300',
          state === 'success' && 'bg-green-50 border border-green-300',
          state === 'error' && 'bg-red-50 border border-red-400',
        )}
      >
        {label}
      </span>
      <SaveIndicator state={state} errorMsg={errorMsg} />
    </span>
  )
}
