import { useState, useEffect, useMemo } from 'react'
import { DatassStore } from '../../core/store'
import { BaseUseT } from '../../core/types'

/**
 * Create a React hook that subscribes to store updates.
 * Returns the current state value from the store.
 */
export const createStoreHook = <StateT>(store: DatassStore<StateT>) => {
  return (selector?: (state: StateT) => any): any => {
    const id = useMemo(() => crypto.randomUUID(), [])
    const initialValue = selector ? selector(store.state) : store.state
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
      return store.subscribe({
        derive: selector,
        previousValue: value,
        update: setValue,
        id
      })
    }, [id, selector, value])

    return value
  }
}
