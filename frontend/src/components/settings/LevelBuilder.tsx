import { useState } from 'react'
import { useLogframeStore } from '../../store/logframe'

interface LevelDef {
  label: string
  color: string
  can_have_indicators: boolean
}

interface Props {
  value: Record<string, LevelDef> | null
  onChange: (config: Record<string, LevelDef>) => void
}

const DEFAULT_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1']

export default function LevelBuilder({ value, onChange }: Props) {
  const levels = useLogframeStore((s) => s.data?.levels ?? {})

  const [config, setConfig] = useState<Record<string, LevelDef>>(() => {
    if (value) return value
    // Initialize from current levels
    const init: Record<string, LevelDef> = {}
    Object.entries(levels).forEach(([key, label]) => {
      const idx = Number(key) - 1
      init[key] = {
        label: label as string,
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        can_have_indicators: Number(key) >= 2,
      }
    })
    return init
  })

  const sortedKeys = Object.keys(config).sort((a, b) => Number(a) - Number(b))

  function updateLevel(key: string, field: keyof LevelDef, val: any) {
    const next = { ...config, [key]: { ...config[key], [field]: val } }
    setConfig(next)
    onChange(next)
  }

  function addLevel() {
    const nextKey = String(sortedKeys.length + 1)
    const idx = sortedKeys.length
    const next = {
      ...config,
      [nextKey]: {
        label: `Level ${nextKey}`,
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        can_have_indicators: true,
      },
    }
    setConfig(next)
    onChange(next)
  }

  function removeLevel(key: string) {
    if (sortedKeys.length <= 2) return
    const next = { ...config }
    delete next[key]
    // Re-key to sequential
    const reKeyed: Record<string, LevelDef> = {}
    Object.values(next)
      .sort((a, b) => sortedKeys.indexOf(Object.keys(next).find((k) => next[k] === a)!) - sortedKeys.indexOf(Object.keys(next).find((k) => next[k] === b)!))
      .forEach((def, idx) => {
        reKeyed[String(idx + 1)] = def
      })
    setConfig(reKeyed)
    onChange(reKeyed)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Result Level Configuration</h3>
        <p className="text-xs text-muted mt-1">
          Customize the result hierarchy levels, colors, and which levels can have indicators.
        </p>
      </div>

      <div className="space-y-2">
        {sortedKeys.map((key) => {
          const level = config[key]
          return (
            <div key={key} className="flex items-center gap-3 px-3 py-2 border border-border rounded-md">
              <span className="text-xs text-muted font-mono w-6">L{key}</span>
              <input
                type="color"
                value={level.color}
                onChange={(e) => updateLevel(key, 'color', e.target.value)}
                className="w-8 h-6 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={level.label}
                onChange={(e) => updateLevel(key, 'label', e.target.value)}
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <label className="flex items-center gap-1 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={level.can_have_indicators}
                  onChange={(e) => updateLevel(key, 'can_have_indicators', e.target.checked)}
                  className="rounded border-border"
                />
                Indicators
              </label>
              {sortedKeys.length > 2 && (
                <button
                  onClick={() => removeLevel(key)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>

      {sortedKeys.length < 10 && (
        <button
          onClick={addLevel}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Level
        </button>
      )}
    </div>
  )
}
