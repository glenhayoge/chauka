export interface MonthKey {
  year: number
  month: number
  label: string
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function getMonthsBetween(startDate: string, endDate: string): MonthKey[] {
  const months: MonthKey[] = []
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  let y = sy, m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push({ year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}` })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export function activityOverlapsMonth(start: string, end: string, year: number, month: number): boolean {
  const mStart = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const mEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return start <= mEnd && end >= mStart
}

export function getBarPosition(
  startDate: string,
  endDate: string,
  months: MonthKey[]
): { left: number; width: number } | null {
  const startIdx = months.findIndex((m) =>
    activityOverlapsMonth(startDate, endDate, m.year, m.month)
  )
  const endIdx = months.length - 1 - [...months].reverse().findIndex((m) =>
    activityOverlapsMonth(startDate, endDate, m.year, m.month)
  )
  if (startIdx < 0) return null
  const left = (startIdx / months.length) * 100
  const width = ((endIdx - startIdx + 1) / months.length) * 100
  return { left, width }
}

export function getTodayPosition(months: MonthKey[]): number | null {
  if (months.length === 0) return null
  const today = new Date()
  const ty = today.getFullYear()
  const tm = today.getMonth() + 1
  const td = today.getDate()

  const idx = months.findIndex((m) => m.year === ty && m.month === tm)
  if (idx < 0) return null

  const daysInMonth = new Date(ty, tm, 0).getDate()
  const dayFraction = (td - 1) / daysInMonth
  return ((idx + dayFraction) / months.length) * 100
}

export function getQuarterGroups(months: MonthKey[]): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = []
  for (const m of months) {
    const q = Math.ceil(m.month / 3)
    const label = `Q${q} ${m.year}`
    if (groups.length > 0 && groups[groups.length - 1].label === label) {
      groups[groups.length - 1].span++
    } else {
      groups.push({ label, span: 1 })
    }
  }
  return groups
}
