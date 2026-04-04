import type { SaveState } from '../../hooks/useSaveFeedback'

interface Props {
  state: SaveState
  errorMsg?: string
}

export default function SaveIndicator({ state, errorMsg }: Props) {
  if (state === 'idle') return null

  if (state === 'saving') {
    return (
      <span className="inline-block w-3 h-3 border-2 border-ring border-t-transparent rounded-full animate-spin flex-shrink-0" />
    )
  }

  if (state === 'success') {
    return (
      <span className="text-ok text-xs flex-shrink-0" title="Saved">
        ✓
      </span>
    )
  }

  if (state === 'error') {
    return (
      <span className="text-destructive text-xs flex-shrink-0" title={errorMsg || 'Save failed'}>
        ✗
      </span>
    )
  }

  return null
}
