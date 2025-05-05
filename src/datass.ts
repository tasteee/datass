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
  SubscriberT,
  InnerMiddlewareFunctionT,
  AsyncSetterT,
  DrafterT
} from './global'

import { useState, useEffect, useMemo } from 'react'
import { produce } from 'immer'
import { middleware } from './middleware'

const createId = () => {
  return crypto.randomUUID()
}

const useId = () => {
  return useMemo(createId, [])
}

const setFromEventTargetValue = (set: (value: any) => void) => (event: Event) => {
  const target = event?.target as HTMLInputElement
  const value = target?.value
  if (event && event.target) set(value)
}

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
    
    const use = store.use as BaseUseT<boolean>
    
    const preparedStore: PreparedStoreT<boolean, BooleanSetterT> = {
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
    
    const use = store.use as BaseUseT<number>
    
    const preparedStore: PreparedStoreT<number, NumberSetterT> = {
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
    
    const use = store.use as BaseUseT<DataT>
    
    const preparedStore: PreparedStoreT<DataT, StringSetterT> = {
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
    
    const set = ((value: DataT[]) => store.replaceState(value)) as ArraySetterT<DataT>
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
    
    const use = store.use as unknown as ArrayUseT<DataT>
    use.find = (finder: (item: DataT) => boolean) => 
      use((state: DataT[]) => state.find(finder))
    use.filter = (filter: (item: DataT) => boolean) => 
      use((state: DataT[]) => state.filter(filter)[0])
    
    const preparedStore: PreparedStoreT<DataT[], ArraySetterT<DataT>, ArrayUseT<DataT>> = {
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
    const set = function(value: Partial<DataT>) {
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
    
    const use = store.use as BaseUseT<DataT>
    
    const preparedStore: PreparedStoreT<DataT, ObjectSetterT<DataT>> = {
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