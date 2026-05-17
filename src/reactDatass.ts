import { useEffect, useMemo, useState } from 'react'
import safeGet from 'just-safe-get'
import { Datass, DatassStore, datass as coreDatass } from './datass'
import {
  ArrayUseT,
  BaseUseT,
  PreparedArrayStoreT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  PreparedObjectStoreT,
  PreparedStoreT,
  PreparedStringStoreT,
  ReactPreparedArrayStoreT,
  ReactPreparedBooleanStoreT,
  ReactPreparedNumberStoreT,
  ReactPreparedObjectStoreT,
  ReactPreparedStringStoreT,
  SubscriberT
} from './global'

const REACT_UPGRADE_FLAG = '__datassReactUpgraded'

const useId = () => useMemo(() => crypto.randomUUID(), [])

const createReactUse = <StateT>(store: DatassStore<StateT>) => {
  return (selector?: (state: StateT) => any) => {
    const id = useId()
    const initialValue = selector ? selector(store.state) : store.state
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
      return store.subscribe({
        derive: selector,
        previousValue: value,
        update: setValue,
        id
      } as SubscriberT<StateT>)
    }, [id, selector])

    return value
  }
}

type AnyPreparedStoreT = PreparedStoreT<any, any, any> & {
  [REACT_UPGRADE_FLAG]?: boolean
}

const attachUse = <StoreT extends AnyPreparedStoreT>(store: StoreT) => {
  const baseUse = createReactUse(store.store)
  const use = baseUse as BaseUseT<any> & ArrayUseT<any>

  if (typeof store.set?.lookup === 'function') {
    use.lookup = <ValueT>(path: string | number, fallback?: ValueT) => {
      const stringPath = typeof path === 'number' ? `${path}` : path
      return baseUse((state: any) => safeGet(state, stringPath, fallback))
    }
  }

  if (Array.isArray(store.state)) {
    use.find = (finder: (item: any) => boolean) => {
      return baseUse((state: any[]) => state.find(finder))
    }

    use.filter = (filter: (item: any) => boolean) => {
      return baseUse((state: any[]) => state.filter(filter))
    }

    use.map = <ItemT>(mapper: (item: any) => ItemT) => {
      return baseUse((state: any[]) => state.map(mapper))
    }
  }

  store.use = use
  return store
}

const upgrade = <StoreT extends AnyPreparedStoreT>(store: StoreT): StoreT => {
  if (store[REACT_UPGRADE_FLAG]) return store
  attachUse(store)
  store[REACT_UPGRADE_FLAG] = true
  return store
}

const createReactDatass = (instance: Datass) => {
  return {
    middleware: instance.middleware,
    upgrade,
    boolean: (initialValue: boolean) => upgrade(instance.boolean(initialValue)) as ReactPreparedBooleanStoreT,
    number: (initialValue: number) => upgrade(instance.number(initialValue)) as ReactPreparedNumberStoreT,
    string: <DataT extends string>(initialValue: DataT) =>
      upgrade(instance.string<DataT>(initialValue)) as ReactPreparedStringStoreT<DataT>,
    array: <DataT>(initialValue: DataT[]) => upgrade(instance.array<DataT>(initialValue)) as ReactPreparedArrayStoreT<DataT>,
    object: <DataT extends object>(initialValue: DataT) =>
      upgrade(instance.object<DataT>(initialValue)) as ReactPreparedObjectStoreT<DataT>,
    withMiddleware: (...middlewares) => createReactDatass(instance.withMiddleware(...middlewares))
  }
}

type DatassReactT = ReturnType<typeof createReactDatass> & {
  upgrade: <StoreT extends PreparedStoreT<any, any, any>>(store: StoreT) => StoreT
  boolean: (initialValue: boolean) => ReactPreparedBooleanStoreT
  number: (initialValue: number) => ReactPreparedNumberStoreT
  string: <DataT extends string>(initialValue: DataT) => ReactPreparedStringStoreT<DataT>
  array: <DataT>(initialValue: DataT[]) => ReactPreparedArrayStoreT<DataT>
  object: <DataT extends object>(initialValue: DataT) => ReactPreparedObjectStoreT<DataT>
}

const datass = createReactDatass(coreDatass) as DatassReactT

export { datass }
export type {
  PreparedStoreT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  PreparedStringStoreT,
  PreparedArrayStoreT,
  PreparedObjectStoreT
}
