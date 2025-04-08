import { useState, useEffect, useMemo } from 'react'
import { nanoid } from 'nanoid'

type SubscriberT = {
  id: string
  update: (newState: any) => void
  derive?: (newState: any) => any
  previousValue: any
}

type PreparedStoreT<DataT> = {
  set: any
  use: any
  state: DataT
  store: DatassStore<DataT>
}

const useId = () => {
  return useMemo(() => nanoid(), [])
}

class Datass {
  middlewares: any = []

  boolean = (initialValue: boolean) => {
    type PreparedT = PreparedStoreT<boolean>
    const store = new DatassStore<boolean>(initialValue)

    const set = (value: boolean) => store.replaceState(value)
    set.toggle = () => set(!store.state)

    const use = store.use
    const preparedStore = this.prepareFinalStore<boolean>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<PreparedT>(preparedStore, this.middlewares)

    return withMiddlewares
  }

  number = (initialValue: number) => {
    type PreparedT = PreparedStoreT<number>
    const store = new DatassStore<number>(initialValue)

    const set = (value: number) => store.replaceState(value)
    set.add = (value: number) => set(store.state + value)
    set.subtract = (value: number) => set(store.state - value)

    const use = store.use
    const preparedStore = this.prepareFinalStore<number>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<PreparedT>(preparedStore, this.middlewares)

    return withMiddlewares
  }

  string = (initialValue: string) => {
    type PreparedT = PreparedStoreT<string>
    const store = new DatassStore<string>(initialValue)

    const set = (value: string) => store.replaceState(value)

    const use = store.use
    const preparedStore = this.prepareFinalStore<string>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<PreparedT>(preparedStore, this.middlewares)

    return withMiddlewares
  }

  array = <DataT>(initialValue: DataT[]) => {
    type UseT = {
      (...args: any): void
      find(finder: any): void
    }
    type StateT = DataT[]
    type PreparedT = PreparedStoreT<StateT>

    const store = new DatassStore<StateT>(initialValue)

    const set = (value: StateT) => store.replaceState(value)
    set.prepend = (...items: DataT[]) => set([...items, ...store.state])
    set.append = (...items: DataT[]) => set([...store.state, ...items])

    const use: UseT = (...args: any) => store.use(...args)
    use.find = (finder: (item: DataT) => boolean) => use((state: StateT) => state.find(finder))

    const preparedStore = this.prepareFinalStore<StateT>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<PreparedT>(preparedStore, this.middlewares)

    return withMiddlewares
  }

  object = <DataT>(initialValue: DataT) => {
    type PartialT = Partial<DataT>
    type PreparedT = PreparedStoreT<DataT>

    const store = new DatassStore<DataT>(initialValue)

    const set = (value: PartialT) => {
      const mergedState = { ...store.state, ...value }
      store.replaceState(mergedState as DataT)
    }

    const use = store.use
    const preparedStore = this.prepareFinalStore<DataT>(store, set, use)
    const withMiddlewares = this.applyMiddlewares<PreparedT>(preparedStore, this.middlewares)

    return withMiddlewares
  }

  withMiddleware = (...middlewares: any[]) => {
    const _datass = new Datass()
    _datass.middlewares = middlewares
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

  applyMiddlewares = <StoreT>(preparedStore: StoreT, middlewares: Function[] = []) => {
    return middlewares.reduce((final, middleware: any) => {
      const storeWithMiddlewareApplied = middleware(final)
      return storeWithMiddlewareApplied
    }, preparedStore)
  }
}

class DatassStore<StateT> {
  initialState: StateT
  currentState: StateT
  previousState: StateT
  subscribers = new Map<string, SubscriberT>()

  constructor(initialState: StateT) {
    this.initialState = initialState
    this.currentState = initialState // Initialize currentState
    this.previousState = initialState // Initialize previousState
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

  subscribe = (subscriber: SubscriberT) => {
    this.subscribers.set(subscriber.id, subscriber)
    return () => this.unsubscribe(subscriber.id)
  }

  replaceState = (newState: StateT) => {
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
