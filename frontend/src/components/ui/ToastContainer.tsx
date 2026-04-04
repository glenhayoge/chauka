import { useToastStore } from '../../store/toast'
import clsx from 'clsx'

const STYLES = {
  success: 'bg-ok text-background',
  error: 'bg-destructive text-background',
  info: 'bg-primary text-background',
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]',
            STYLES[toast.type],
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-background/70 hover:text-background flex-shrink-0"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
