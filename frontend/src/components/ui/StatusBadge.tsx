import clsx from 'clsx'

type Status = 'OK' | 'WARNING' | 'DANGER'

const STYLES: Record<Status, string> = {
  OK: 'bg-ok/10 text-ok',
  WARNING: 'bg-warning/10 text-warning',
  DANGER: 'bg-destructive/10 text-destructive',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', STYLES[status])}>
      {status}
    </span>
  )
}
