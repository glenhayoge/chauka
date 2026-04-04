import clsx from 'clsx'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import SaveIndicator from './SaveIndicator'

interface Props {
  value: boolean
  onChange: (value: boolean) => void | Promise<void>
  label?: string
  disabled?: boolean
}

export default function EditableCheckbox({ value, onChange, label, disabled }: Props) {
  const { state, errorMsg, wrap } = useSaveFeedback()

  return (
    <label
      className={clsx(
        'inline-flex items-center gap-2 transition-colors duration-300 rounded px-1',
        disabled ? 'opacity-50' : 'cursor-pointer',
        state === 'saving' && 'animate-pulse',
        state === 'success' && 'bg-ok/10',
        state === 'error' && 'bg-destructive/10',
      )}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => !disabled && wrap(() => onChange(e.target.checked))}
        disabled={disabled}
        className="rounded"
      />
      {label && <span className="text-sm">{label}</span>}
      <SaveIndicator state={state} errorMsg={errorMsg} />
    </label>
  )
}
