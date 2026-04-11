import { useEffect, useId, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import FocusTrap from 'focus-trap-react'
import { applyLibraryIndicator } from '../../api/indicatorLibrary'
import type { LibraryIndicator } from '../../api/types'
import IndicatorLibrarySearch from './IndicatorLibrarySearch'
import IndicatorLibraryDetail from './IndicatorLibraryDetail'

interface Props {
  logframePublicId: string
  resultId: number
  organisationId: number | null
  orgSector?: string
  onClose: () => void
}

export default function UseFromLibraryDialog({ logframePublicId, resultId, organisationId, orgSector, onClose }: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<LibraryIndicator | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const titleId = useId()

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleUse() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await applyLibraryIndicator(selected.id, {
        logframe_public_id: logframePublicId,
        result_id: resultId,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframePublicId] })
      onClose()
    } catch {
      setError('Failed to add indicator')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false, allowOutsideClick: true }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh]"
      >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-[var(--radius)] w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p id={titleId} className="text-sm font-medium text-foreground">
            {selected ? 'Indicator preview' : 'Browse indicator library'}
            {!selected && orgSector && (
              <span className="text-muted-foreground font-normal"> · {orgSector}</span>
            )}
          </p>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!selected ? (
            <IndicatorLibrarySearch
              organisationId={organisationId}
              initialSector={orgSector}
              onSelect={setSelected}
              selectable
            />
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">{selected.name}</h3>
              <IndicatorLibraryDetail indicator={selected} />
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div className="border-t border-border px-5 py-3 flex items-center gap-3">
            <button
              onClick={handleUse}
              disabled={saving}
              className="px-4 py-1.5 bg-foreground text-background text-sm rounded-[var(--radius)] hover:bg-foreground/80 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Adding...' : 'Use this indicator'}
            </button>
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-1.5 border border-border text-sm rounded-[var(--radius)] hover:bg-muted transition-colors"
            >
              Back to search
            </button>
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        )}
      </div>
      </div>
    </FocusTrap>
  )
}
