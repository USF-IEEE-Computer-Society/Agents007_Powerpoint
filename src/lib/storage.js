const STORAGE_KEY = 'ieeecs-usf.experiences.v1'

/**
 * Read the saved experiences. Returns [] whenever storage is unavailable
 * (private windows, blocked site data) or holds something we can't use, so a
 * bad value never keeps the page from rendering.
 */
export function loadExperiences() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isExperience)
  } catch {
    return []
  }
}

export function saveExperiences(experiences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences))
  } catch {
    // Storage full or blocked — the in-memory list still works for this visit.
  }
}

function isExperience(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.role === 'string' &&
    typeof value.startDate === 'string'
  )
}
