// src/useDatass.ts
import { datass } from 'datass'
import { useMemo } from 'react'

export const useDatass = (() => {
  const string = (initialState: string = '') => {
    const store = useMemo(() => datass.string(initialState), [])
    store.use() // This subscribes the component to state changes
    return store
  }

  const boolean = (initialState: boolean = false) => {
    const store = useMemo(() => datass.boolean(initialState), [])
    store.use()
    return store
  }

  const number = (initialState: number = 0) => {
    const store = useMemo(() => datass.number(initialState), [])
    store.use()
    return store
  }

  const array = <DataT>(initialState: DataT[] = []) => {
    const store = useMemo(() => datass.array<DataT>(initialState), [])
    store.use()
    return store
  }

  const object = <DataT extends Object>(initialState: DataT) => {
    const store = useMemo(() => datass.object<DataT>(initialState), [])
    store.use()
    return store
  }

  return { string, boolean, array, object, number }
})()
