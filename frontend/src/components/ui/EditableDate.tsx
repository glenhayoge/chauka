import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import SaveIndicator from './SaveIndicator'
import { formatDateDisplay } from '../../utils/format'

interface Props {
  value: string | null
  onSave: (value: string | null) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
  /** Minimum allowed date (YYYY-MM-DD) — e.g. a linked start_date */
  min?: string | null
  /** Maximum allowed date (YYYY-MM-DD) — e.g. a linked end_date */
  max?: string | null
  className?: string
}

export default function EditableDate({
  value,
  onSave,
  placeholder,
  disabled,
  min,
  max,
  className,
}: Props) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, errorMsg, wrap } = useSaveFeedback()

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const v = e.target.value || null
    setEditing(false)
    if (v !== value) {
      wrap(() => onSave(v))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditing(false)
    if (e.key === 'Enter') inputRef.current?.blur()
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value ?? ''}
        min={min ?? undefined}
        max={max ?? undefined}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={clsx(
          'border border-blue-400 rounded px-1 py-0.5 text-xs w-32',
          className,
        )}
      />
    )
  }

  const display = value ? formatDateDisplay(value) : placeholder || '—'

  return (
    <span className="inline-flex items-center gap-1">
      <span
        onClick={() => !disabled && setEditing(true)}
        className={clsx(
          'rounded px-1 transition-colors duration-300 text-xs',
          !disabled && 'cursor-pointer hover:bg-yellow-50 active:bg-yellow-100',
          !value && 'text-gray-400 italic',
          disabled && 'cursor-default',
          state === 'saving' && 'animate-pulse border border-blue-300',
          state === 'success' && 'bg-green-50 border border-green-300',
          state === 'error' && 'bg-red-50 border border-red-400',
        )}
      >
        {display}
      </span>
      <SaveIndicator state={state} errorMsg={errorMsg} />
    </span>
  )
}
