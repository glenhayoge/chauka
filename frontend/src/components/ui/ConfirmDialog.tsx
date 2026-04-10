import { useEffect, useId, useRef } from 'react'
import FocusTrap from 'focus-trap-react'

interface Props {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descId = useId()

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false, allowOutsideClick: true }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onCancel}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
          <h3 id={titleId} className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p id={descId} className="text-sm text-muted-foreground mb-6">{description}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted"
            >
              {cancelText}
            </button>
            <button
              ref={confirmRef}
              onClick={() => { onConfirm(); onCancel() }}
              className={`px-4 py-2 text-sm font-medium text-background rounded-md ${
                destructive
                  ? 'bg-destructive hover:bg-destructive/80'
                  : 'bg-primary hover:bg-primary/80'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  )
}
