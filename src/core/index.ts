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
  AsyncSetterT,
  DrafterT,
  ObjectUseT
} from './types'

import { produce } from 'immer'
import { middleware } from './middleware'
import safeGet from 'just-safe-get'
import safeSet from 'just-safe-set'
import { DatassStore } from './store'

const createByAsync = <DataT>(store: DatassStore<DataT>) => {
  return async (asyncUpdater: AsyncSetterT<DataT>) => {
    try {
      const result = await asyncUpdater(store.state)
      const isResultFunction = typeof result === 'function'
      if (!isResultFunction) store.replaceState(result)
      if (isResultFunction) {
        const drafter = result as Function
        const setter = (draft: DataT) => drafter(draft)
        store.replaceState(setter)
      }
      return true
    } catch (error) {
      console.error('[datass: error in async update]', error)
      return false
    }
  }
}

const createSetBy = <DataT>(store: DatassStore<DataT>) => {
  return (updaterFn: (draft: DataT) => void | DataT) => {
    store.replaceState((draft) => updaterFn(draft))
  }
}

const setFromEventTargetValue = (set: (value: any) => void) => (event: Event) => {
  const target = event?.target as HTMLInputElement
  const value = target?.value
  if (event && event.target) set(value)
}

type DraftFnT<StateT> = (draft: StateT) => void | StateT

/**
 * Framework-agnostic state management factory.
 * Creates stores without any framework-specific hooks.
 * Use adapters (e.g., React) to integrate with your framework.
 */
export class Datass {
  middleware = middleware
  stagedMiddleware: InnerMiddlewareFunctionT[] = []

  boolean = (initialValue: boolean): PreparedBooleanStoreT => {
    const store = new DatassStore<boolean>(initialValue)

    const set = ((value: boolean) => store.replaceState(!!value)) as BooleanSetterT
    set.toggle = () => set(!store.state)
    set.byAsync = createByAsync<boolean>(store)
    set.by = createSetBy<boolean>(store)
    set.reset = () => set(store.initialState)

    const use = (() => {
      throw new Error('use() is not available in core. Import from the React adapter or your framework adapter.')
    }) as BaseUseT<boolean>

    const preparedStore: PreparedStoreT<boolean, BooleanSetterT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      use,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<boolean, BooleanSetterT, BaseUseT<boolean>>(preparedStore)
    return withMiddlewares as PreparedBooleanStoreT
  }

  number = (initialValue: number): PreparedNumberStoreT => {
    const store = new DatassStore<number>(initialValue)

    const asNumber = (value: any) => (typeof value === 'number' ? value : Number(value))
    const set = ((value: number) => store.replaceState(asNumber(value))) as NumberSetterT
    set.fromEventTarget = setFromEventTargetValue(set)
    set.add = (value: number) => set(store.state + value)
    set.subtract = (value: number) => set(store.state - value)
    set.byAsync = createByAsync<number>(store)
    set.by = createSetBy<number>(store)
    set.reset = () => set(store.initialState)

    const use = (() => {
      throw new Error('use() is not available in core. Import from the React adapter or your framework adapter.')
    }) as BaseUseT<number>

    const preparedStore: PreparedStoreT<number, NumberSetterT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      use,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<number, NumberSetterT, BaseUseT<number>>(preparedStore)
    return withMiddlewares as PreparedNumberStoreT
  }

  string = <DataT extends string>(initialValue: DataT): PreparedStringStoreT => {
    const store = new DatassStore<DataT>(initialValue as DataT)

    const set = ((value: DataT) => store.replaceState(value)) as StringSetterT
    set.fromEventTarget = setFromEventTargetValue(set)
    set.byAsync = createByAsync<DataT>(store)
    set.by = createSetBy<DataT>(store)
    set.reset = () => set(store.initialState)

    const use = (() => {
      throw new Error('use() is not available in core. Import from the React adapter or your framework adapter.')
    }) as BaseUseT<DataT>

    const preparedStore: PreparedStoreT<DataT, StringSetterT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      use,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<string, StringSetterT, BaseUseT<string>>(preparedStore)
    return withMiddlewares as PreparedStringStoreT
  }

  array = <DataT>(initialValue: DataT[]): PreparedArrayStoreT<DataT> => {
    const store = new DatassStore<DataT[]>(initialValue)

    const set = ((value: DataT[]) => {
      return store.replaceState(value)
    }) as ArraySetterT<DataT>

    set.prepend = (...items: DataT[]) => {
      set.by((draft) => {
        draft.unshift(...items)
      })
    }

    set.append = (...items: DataT[]) => {
      set.by((draft) => {
        draft.push(...items)
      })
    }

    set.byAsync = createByAsync<DataT[]>(store)
    set.by = createSetBy<DataT[]>(store)
    set.reset = () => set(store.initialState)

    const use = (() => {
      throw new Error('use() is not available in core. Import from the React adapter or your framework adapter.')
    }) as unknown as ArrayUseT<DataT>

    set.lookup = (path: string, value) => {
      const stringPath = typeof path === 'number' ? `${path}` : path

      store.replaceState((draft) => {
        safeSet(draft, stringPath, value)
      })
    }

    use.lookup = <ValueT>(path: string, fallback?: ValueT) => {
      const stringPath = typeof path === 'number' ? `${path}` : path
      return use((state) => safeGet(state, stringPath, fallback))
    }

    use.find = <ValueT>(finder: (item: DataT) => boolean) => {
      return use((state: DataT[]) => {
        const result = state.find(finder)
        return result
      })
    }

    use.filter = (filter: (item: DataT) => boolean) => {
      return use((state: DataT[]) => state.filter(filter))
    }

    use.map = <ItemT>(mapper: (item: DataT) => ItemT) => {
      return use((state: DataT[]) => state.map(mapper))
    }

    const preparedStore: PreparedStoreT<DataT[], ArraySetterT<DataT>, ArrayUseT<DataT>> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      use,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<DataT[], ArraySetterT<DataT>, ArrayUseT<DataT>>(preparedStore)
    return withMiddlewares as PreparedArrayStoreT<DataT>
  }

  object = <DataT extends object>(initialValue: DataT): PreparedObjectStoreT<DataT> => {
    const store = new DatassStore<DataT>(initialValue)

    // Define set function to accept partial updates
    const set = function (value: Partial<DataT>) {
      const mergedState = { ...store.state, ...value }
      store.replaceState(mergedState as DataT)
    } as ObjectSetterT<DataT>

    set.replace = (value: DataT) => {
      store.replaceState(() => value)
    }

    set.byAsync = async (asyncUpdater: AsyncSetterT<DataT>) => {
      try {
        const result = await asyncUpdater(store.state)
        if (typeof result === 'function') {
          store.replaceState((draft) => (result as Function)(draft))
        } else {
          const mergedState = { ...store.state, ...(result as Partial<DataT>) }
          store.replaceState(mergedState as DataT)
        }
        return true
      } catch (error) {
        console.error('Error in async update:', error)
        return false
      }
    }

    set.by = createSetBy<DataT>(store)
    set.reset = () => set.replace(store.initialState)

    set.lookup = (path: string, value) => {
      store.replaceState((draft) => {
        safeSet(draft, path, value)
      })
    }

    const use = (() => {
      throw new Error('use() is not available in core. Import from the React adapter or your framework adapter.')
    }) as BaseUseT<DataT> as ObjectUseT<DataT>

    use.lookup = <ValueT>(path: string, fallback?: ValueT) => {
      return use((state) => safeGet(state, path, fallback))
    }

    const preparedStore: PreparedStoreT<DataT, ObjectSetterT<DataT>, ObjectUseT<DataT>> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      use,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<DataT, ObjectSetterT<DataT>, BaseUseT<DataT>>(preparedStore)
    return withMiddlewares as PreparedObjectStoreT<DataT>
  }

  withMiddleware = (...middlewares: InnerMiddlewareFunctionT[]) => {
    const _datass = new Datass()
    _datass.stagedMiddleware = middlewares
    return _datass
  }

  private applyMiddlewares<DataT, SetT extends BaseSetterT<DataT>, UseT>(
    preparedStore: PreparedStoreT<DataT, SetT, UseT>
  ): PreparedStoreT<DataT, SetT, UseT> {
    return this.stagedMiddleware.reduce((final, middleware) => {
      // @ts-ignore
      const storeWithMiddlewareApplied = middleware(final) as PreparedStoreT<DataT, SetT, UseT>
      return storeWithMiddlewareApplied
    }, preparedStore)
  }
}

export const datassCore = new Datass()

// Re-export types
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
} from './types'

export { DatassStore } from './store'
export { middleware } from './middleware'
