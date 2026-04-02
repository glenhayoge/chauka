import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import SaveIndicator from './SaveIndicator'

interface Props {
  value: number | null
  onSave: (value: number | null) => void | Promise<void>
  currency?: string
  disabled?: boolean
}

export default function EditableNumber({ value, onSave, currency, disabled }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, errorMsg, wrap } = useSaveFeedback()

  useEffect(() => {
    setDraft(String(value ?? ''))
  }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleBlur() {
    setEditing(false)
    const parsed = draft === '' ? null : parseFloat(draft)
    if (parsed !== value) wrap(() => onSave(parsed !== null && isNaN(parsed) ? null : parsed))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') {
      setDraft(String(value ?? ''))
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="border border-blue-400 rounded px-1 py-0.5 w-24 text-right"
      />
    )
  }

  const display = value !== null && value !== undefined
    ? `${currency ? currency + ' ' : ''}${value.toLocaleString()}`
    : '\u2014'

  return (
    <span className="inline-flex items-center gap-1">
      <span
        onClick={() => !disabled && setEditing(true)}
        className={clsx(
          'rounded px-1 transition-colors duration-300',
          !disabled && 'cursor-pointer hover:bg-yellow-50 active:bg-yellow-100',
          disabled && 'cursor-default hover:bg-transparent',
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
