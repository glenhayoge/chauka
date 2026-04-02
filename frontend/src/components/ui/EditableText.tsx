import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import SaveIndicator from './SaveIndicator'

interface Props {
  value: string
  onSave: (value: string) => void | Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function EditableText({ value, onSave, placeholder, className, disabled }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, errorMsg, wrap } = useSaveFeedback()

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleBlur() {
    setEditing(false)
    if (draft !== value) wrap(() => onSave(draft))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={clsx('border border-blue-400 rounded px-1 py-0.5 w-full', className)}
      />
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span
        onClick={() => !disabled && setEditing(true)}
        className={clsx(
          'rounded px-1 py-0.5 transition-colors duration-300',
          !disabled && 'cursor-pointer hover:bg-yellow-50 active:bg-yellow-100',
          !value && 'text-gray-400 italic',
          disabled && 'cursor-default hover:bg-transparent',
          state === 'saving' && 'animate-pulse border border-blue-300',
          state === 'success' && 'bg-green-50 border border-green-300',
          state === 'error' && 'bg-red-50 border border-red-400',
          state === 'idle' && '',
          className
        )}
      >
        {value || placeholder || 'Click to edit'}
      </span>
      <SaveIndicator state={state} errorMsg={errorMsg} />
    </span>
  )
}
