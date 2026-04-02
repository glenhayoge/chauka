const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function displayDate(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`
}

export function cleanDate(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function displayNumber(value: number | null | undefined, currency?: string): string {
  if (value === null || value === undefined) return ''
  const formatted = value.toLocaleString()
  return currency ? `${currency} ${formatted}` : formatted
}

/** Check if two date ranges overlap (8-case logic from original) */
export function intersects(
  aStart: { month: number; year: number },
  aEnd: { month: number; year: number },
  bStart: { month: number; year: number },
  bEnd: { month: number; year: number }
): boolean {
  const toNum = (m: number, y: number) => y * 12 + m
  return (
    toNum(aStart.month, aStart.year) <= toNum(bEnd.month, bEnd.year) &&
    toNum(aEnd.month, aEnd.year) >= toNum(bStart.month, bStart.year)
  )
}

/** Format an ISO date string (YYYY-MM-DD) as DD/MM/YYYY for display */
export function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+="[^"]*"/gi, '')
    .replace(/\s*on\w+='[^']*'/gi, '')
}
