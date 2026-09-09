/**
 * Builds a read/write pair over one localStorage key holding a JSON array.
 *
 * Every access is guarded: private windows, cleared site data, and browsers
 * set to block site data throw on access rather than returning null, and an
 * unguarded read would white-screen the app. Anything unreadable or the wrong
 * shape degrades to an empty list.
 *
 * Keys are versioned. If the shape of a record changes, bump the version and
 * old records are ignored instead of crashing against the new code.
 */
export function createStore(key, isValidItem) {
  return {
    load() {
      try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        return parsed.filter(isValidItem)
      } catch {
        return []
      }
    },

    save(items) {
      try {
        window.localStorage.setItem(key, JSON.stringify(items))
      } catch {
        // Storage full or blocked — the in-memory list still works this visit.
      }
    },
  }
}

function hasStrings(value, fields) {
  return (
    value !== null &&
    typeof value === 'object' &&
    fields.every((field) => typeof value[field] === 'string')
  )
}

export const experienceStore = createStore(
  'ieeecs-usf.experiences.v1',
  (value) => hasStrings(value, ['id', 'role', 'startDate']),
)

export const jobStore = createStore('ieeecs-usf.jobs.v1', (value) =>
  hasStrings(value, ['id', 'title', 'company', 'description']),
)
