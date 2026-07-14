import { useMemo } from 'react'
import {
  BaseSetterT,
  BooleanSetterT,
  NumberSetterT,
  StringSetterT,
  ArraySetterT,
  ObjectSetterT,
  BaseUseT,
  ArrayUseT,
  PreparedStoreT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  PreparedStringStoreT,
  PreparedArrayStoreT,
  PreparedObjectStoreT,
  InnerMiddlewareFunctionT,
  ObjectUseT
} from '../../core/types'

import { Datass } from '../../core'
import { createStoreHook } from './hooks'

/**
 * React-specific Datass factory that wraps stores with React hooks.
 * Extends the core Datass class to add .use() hooks to each store type.
 */
class ReactDatass extends Datass {
  boolean = (initialValue: boolean): PreparedBooleanStoreT => {
    const store = super.boolean(initialValue)
    const use = createStoreHook(store.store) as BaseUseT<boolean>
    return {
      ...store,
      use
    } as PreparedBooleanStoreT
  }

  number = (initialValue: number): PreparedNumberStoreT => {
    const store = super.number(initialValue)
    const use = createStoreHook(store.store) as BaseUseT<number>
    return {
      ...store,
      use
    } as PreparedNumberStoreT
  }

  string = <DataT extends string>(initialValue: DataT): PreparedStringStoreT => {
    const store = super.string(initialValue)
    const use = createStoreHook(store.store) as BaseUseT<DataT>
    return {
      ...store,
      use
    } as PreparedStringStoreT
  }

  array = <DataT>(initialValue: DataT[]): PreparedArrayStoreT<DataT> => {
    const store = super.array(initialValue)
    const use = createStoreHook(store.store) as unknown as ArrayUseT<DataT>
    return {
      ...store,
      use
    } as PreparedArrayStoreT<DataT>
  }

  object = <DataT extends object>(initialValue: DataT): PreparedObjectStoreT<DataT> => {
    const store = super.object(initialValue)
    const use = createStoreHook(store.store) as BaseUseT<DataT> as ObjectUseT<DataT>
    return {
      ...store,
      use
    } as PreparedObjectStoreT<DataT>
  }

  withMiddleware = (...middlewares: InnerMiddlewareFunctionT[]) => {
    const _datass = new ReactDatass()
    _datass.stagedMiddleware = middlewares
    return _datass
  }
}

export const datass = new ReactDatass()

/**
 * React hook-based local stores.
 * Creates store instances scoped to a component.
 */
export const useDatass = (() => {
  const string = (initialState: string = '') => {
    const store = useMemo(() => datass.string(initialState), [])
    store.use()
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

  const object = <DataT extends object>(initialState: DataT) => {
    const store = useMemo(() => datass.object<DataT>(initialState), [])
    store.use()
    return store
  }

  return { string, boolean, array, object, number }
})()

// Re-export all core types
export type {
  WatchReactionT,
  WatchOptionsT,
  BaseSetterT,
  BooleanSetterT,
  NumberSetterT,
  StringSetterT,
  ArraySetterT,
  ObjectSetterT,
  BaseUseT,
  ObjectUseT,
  ArrayUseT,
  PreparedStoreT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  PreparedStringStoreT,
  PreparedArrayStoreT,
  PreparedObjectStoreT,
  MiddlewareFunctionT,
  InnerMiddlewareFunctionT,
  SubscriberT,
  DrafterT,
  AsyncSetterT,
  BooleanDrafterT,
  NumberDrafterT,
  StringDrafterT,
  ArrayDrafterT,
  ObjectDrafterT
} from '../../core/types'

export { DatassStore } from '../../core/store'
export { middleware } from '../../core/middleware'
