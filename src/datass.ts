import {
  SetterT,
  PreparedStoreT,
  SubscriberT,
  MiddlewareFunctionT,
  InnerMiddlewareFunctionT,
  AsyncSetterT,
  DrafterT,
  BooleanDrafterT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  NumberDrafterT,
  PreparedStringStoreT,
  StringDrafterT
} from './global'
import { useState, useEffect, useMemo } from 'react'
import { nanoid } from 'nanoid'
import { produce } from 'immer'
import { middleware } from './middleware'

const useId = () => {
  return useMemo(() => nanoid(), [])
}

const setFromEventTargetValue = (set: SetterT) => (event: Event) => {
  const target = event?.target as HTMLInputElement
  const value = target?.value
  if (event && event.target) set(value)
}

const createByAsync = <DataT>(store) => {
  return async (asyncUpdater: AsyncSetterT<DataT>) => {
    try {
      const result = await asyncUpdater(store.state)
      const isResultFunction = typeof result === 'function'
      if (!isResultFunction) store.replaceState(result)

      if (isResultFunction) {
        const drafter = result as Function
        const setter = (draft) => drafter(draft)
        store.replaceState(setter)
      }

      return true
    } catch (error) {
      console.error('[datass: error in async update]', error)
      return false
    }
  }
}

const createSetBy = <DataT>(store) => {
  return (updaterFn: (draft: DataT) => void | DataT) => {
    store.replaceState((draft) => updaterFn(draft))
  }
}

export class Datass {
  middleware = middleware
  stagedMiddleware: InnerMiddlewareFunctionT[] = []

  boolean = (initialValue: boolean) => {
    type PreparedT = PreparedStoreT<boolean>
    const store = new DatassStore<boolean>(initialValue)
    const set = (value: boolean) => store.replaceState(!!value)
    set.toggle = () => set(!store.state)
    set.byAsync = createByAsync<boolean>(store)
    set.by = createSetBy<boolean>(store)
    const use = store.use
    const preparedStore = this.prepareFinalStore<boolean>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<boolean, PreparedT>(preparedStore)
    return withMiddlewares
  }

  number = (initialValue: number) => {
    type PreparedT = PreparedStoreT<number>
    const store = new DatassStore<number>(initialValue)
    const asNumber = (value: any) => (typeof value === 'number' ? value : Number(value))
    const set = (value: number) => store.replaceState(asNumber(value))
    set.fromEventTarget = setFromEventTargetValue(set)
    set.add = (value: number) => set(store.state + value)
    set.subtract = (value: number) => set(store.state - value)
    set.byAsync = createByAsync<number>(store)
    set.by = createSetBy<number>(store)
    const use = store.use
    const preparedStore = this.prepareFinalStore<number>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<number, PreparedT>(preparedStore)
    return withMiddlewares
  }

  string = (initialValue: string) => {
    type PreparedT = PreparedStoreT<string>
    const store = new DatassStore<string>(initialValue)
    const set = (value: string) => store.replaceState(value)
    set.fromEventTarget = setFromEventTargetValue(set)
    set.byAsync = createByAsync<string>(store)
    set.by = createSetBy<string>(store)
    const use = store.use
    const preparedStore = this.prepareFinalStore<string>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<string, PreparedT>(preparedStore)
    return withMiddlewares
  }

  array = <DataT>(initialValue: DataT[]) => {
    type StateT = DataT[]
    type PreparedT = PreparedStoreT<StateT>

    type UseT = {
      (...args: any): void
      find(finder: any): void
      filter(filter: any): void
    }

    const store = new DatassStore<StateT>(initialValue)
    const set = (value: StateT) => store.replaceState(value)

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

    set.byAsync = createByAsync<StateT>(store)
    set.by = createSetBy<StateT>(store)
    const use: UseT = (...args: any) => store.use(...args)
    use.find = (finder: (item: DataT) => boolean) => use((state: StateT) => state.find(finder))
    use.filter = (filter: (item: DataT) => boolean) => use((state: StateT) => state.find(filter))
    const preparedStore = this.prepareFinalStore<StateT>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<StateT, PreparedT>(preparedStore)
    return withMiddlewares
  }

  object = <DataT>(initialValue: DataT) => {
    type PartialT = Partial<DataT>
    type PreparedT = PreparedStoreT<DataT>
    const store = new DatassStore<DataT>(initialValue)
    // For objects, set merges the value with current state
    const set = (value: PartialT) => {
      const mergedState = { ...store.state, ...value }
      store.replaceState(mergedState as DataT)
    }

    set.replace = (value: DataT) => {
      store.replaceState(() => value)
    }

    set.byAsync = async (asyncUpdater: (state: DataT) => Promise<((draft: DataT) => void) | PartialT>) => {
      try {
        const result = await asyncUpdater(store.state)
        if (typeof result === 'function') {
          store.replaceState((draft) => (result as Function)(draft))
        } else {
          // If result is an object, merge it with current state
          const mergedState = { ...store.state, ...(result as PartialT) }
          store.replaceState(mergedState as DataT)
        }
        return true
      } catch (error) {
        console.error('Error in async update:', error)
        return false
      }
    }

    set.by = createSetBy<number>(store)
    const use = store.use
    const preparedStore = this.prepareFinalStore<DataT>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<DataT, PreparedT>(preparedStore)
    return withMiddlewares
  }

  withMiddleware = (...middlewares: any[]) => {
    const _datass = new Datass()
    _datass.stagedMiddleware = middlewares
    return _datass
  }

  prepareFinalStore = <DataT>(store: DatassStore<DataT>, set: any, use: any) => {
    set.reset = () => set(store.initialState)

    return {
      set,
      use,
      store,
      get state() {
        return store.state
      }
    }
  }

  applyMiddlewares = <DataT, StoreT extends PreparedStoreT<DataT>>(preparedStore: StoreT) => {
    return this.stagedMiddleware.reduce((final, middleware) => {
      const storeWithMiddlewareApplied = middleware<DataT, StoreT>(final)
      return storeWithMiddlewareApplied
    }, preparedStore)
  }
}

export class DatassStore<StateT> {
  initialState: StateT
  currentState: StateT
  previousState: StateT
  subscribers = new Map<string, SubscriberT<StateT>>()

  constructor(initialState: StateT) {
    this.initialState = initialState
    this.currentState = initialState
    this.previousState = initialState
    return this
  }

  public get state() {
    return this.currentState
  }

  use = (selector?: (state: StateT) => any) => {
    const id = useId()
    const initialValue = selector ? selector(this.state) : this.state
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
      return this.subscribe({
        derive: selector,
        previousValue: value,
        update: setValue,
        id
      })
    }, [id, selector])

    return value
  }

  unsubscribe = (id: string) => {
    this.subscribers.delete(id)
  }

  subscribe = (subscriber: SubscriberT<StateT>) => {
    this.subscribers.set(subscriber.id, subscriber)
    return () => this.unsubscribe(subscriber.id)
  }

  replaceState = (newStateOrUpdater: StateT | ((draft: StateT) => void | StateT)) => {
    let newState: StateT

    if (typeof newStateOrUpdater === 'function') {
      // Use immer's produce for updater functions
      newState = produce(this.currentState, newStateOrUpdater as (draft: StateT) => void | StateT)
    } else {
      newState = newStateOrUpdater
    }

    // Skip update if state hasn't changed
    if (newState === this.currentState) return

    this.previousState = this.currentState
    this.currentState = newState

    // Notify all subscribers about the state change
    this.subscribers.forEach((subscriber) => {
      if (subscriber.derive) {
        // For subscribers with selectors, only update if selected value changed
        const newResult = subscriber.derive(newState)
        const areEqual = subscriber.previousValue === newResult
        if (!areEqual) {
          subscriber.update(newResult)
          subscriber.previousValue = newResult
        }
      } else if (subscriber.previousValue !== newState) {
        // For subscribers tracking the full state
        subscriber.update(newState)
        subscriber.previousValue = newState
      }
    })
  }
}

const datass = new Datass()
export { datass }
