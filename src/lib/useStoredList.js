import { useEffect, useState } from 'react'

/**
 * Keeps a list in React state and mirrored into a store, so both features
 * persist the same way. Reads once on the first render, before anything
 * paints, so a saved list never flashes empty.
 */
export function useStoredList(store) {
  const [items, setItems] = useState(() => store.load())

  useEffect(() => {
    store.save(items)
  }, [store, items])

  return {
    items,
    add: (item) => setItems((prev) => [...prev, item]),
    remove: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
  }
}
