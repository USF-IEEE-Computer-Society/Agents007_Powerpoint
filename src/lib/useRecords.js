import { useCallback, useEffect, useState } from 'react'

/**
 * Loads a list from the API on mount and keeps it in sync through create and
 * delete. Both pages persist the same way, so the flow lives here once.
 *
 * `resource` is { list, create, remove } from lib/api.
 */
export function useRecords(resource, noun) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { list, create, remove } = resource

  useEffect(() => {
    let cancelled = false

    list()
      .then((records) => {
        // The request can resolve after the user has navigated away.
        if (!cancelled) setItems(records)
      })
      .catch(() => {
        if (!cancelled) setError(`Couldn't load your ${noun}. Is the API running?`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [list, noun])

  const add = useCallback(
    async (values) => {
      try {
        const saved = await create(values)
        setItems((prev) => [saved, ...prev])
        setError('')
        return true
      } catch {
        setError(`Couldn't save that. Is the API running?`)
        return false
      }
    },
    [create],
  )

  const discard = useCallback(
    async (id) => {
      try {
        await remove(id)
        setItems((prev) => prev.filter((item) => item.id !== id))
        setError('')
      } catch {
        setError(`Couldn't remove that. Is the API running?`)
      }
    },
    [remove],
  )

  return { items, loading, error, add, remove: discard }
}
