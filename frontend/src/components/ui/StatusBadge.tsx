import clsx from 'clsx'

type Status = 'OK' | 'WARNING' | 'DANGER'

const STYLES: Record<Status, string> = {
  OK: 'bg-green-100 text-green-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  DANGER: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', STYLES[status])}>
      {status}
    </span>
  )
}
