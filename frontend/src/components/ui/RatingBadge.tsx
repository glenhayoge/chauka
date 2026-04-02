import { useState, useRef, useEffect } from 'react'
import type { Rating } from '../../api/types'

const DEFAULT_COLOR = '#9ca3af'

interface Props {
  ratingId: number | null
  ratings: Rating[]
  onSave: (ratingId: number | null) => void
  disabled?: boolean
}

export default function RatingBadge({ ratingId, ratings, onSave, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = ratings.find((r) => r.id === ratingId)
  const color = current?.color ?? DEFAULT_COLOR

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => !disabled && setOpen(!open)}
        className={`w-4 h-4 rounded-full border border-gray-300 ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-125'} transition-transform`}
        style={{ backgroundColor: color }}
        aria-label={current?.name ?? 'Not rated'}
        title={current?.name ?? 'Not rated'}
        disabled={disabled}
      />

      {open && (
        <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          {ratings.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSave(r.id === ratingId ? null : r.id)
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-50 text-left"
            >
              <span
                className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: r.color }}
              />
              <span className={r.id === ratingId ? 'font-medium' : ''}>{r.name}</span>
            </button>
          ))}
          {ratingId !== null && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  onSave(null)
                  setOpen(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-50 text-left text-gray-500"
              >
                <span
                  className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: DEFAULT_COLOR }}
                />
                Clear rating
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
