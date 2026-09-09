const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "2025-03" -> "Mar 2025" */
export function formatMonth(value) {
  if (!value) return ''
  const [year, month] = value.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

export function formatRange({ startDate, endDate, current }) {
  const start = formatMonth(startDate)
  const end = current ? 'Present' : formatMonth(endDate)
  return end ? `${start} – ${end}` : start
}

/** Newest first, roles still held float to the top. */
export function byMostRecent(a, b) {
  if (a.current !== b.current) return a.current ? -1 : 1
  return b.startDate.localeCompare(a.startDate)
}
