import {
  BaseSetterT,
  BooleanSetterT,
  NumberSetterT,
  StringSetterT,
  ArraySetterT,
  ObjectSetterT,
  PreparedStoreT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  PreparedStringStoreT,
  PreparedArrayStoreT,
  PreparedObjectStoreT,
  SubscriberT,
  InnerMiddlewareFunctionT,
  AsyncSetterT,
  DrafterT,
  WatchReactionT,
  WatchOptionsT
} from './global'

import { produce } from 'immer'
import { middleware } from './middleware'
import safeGet from 'just-safe-get'
import safeSet from 'just-safe-set'

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

type DraftFnT<StateT> = (draft: StateT) => void | StateT

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

    const preparedStore: PreparedStoreT<boolean, BooleanSetterT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<boolean, BooleanSetterT>(preparedStore)
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

    const preparedStore: PreparedStoreT<number, NumberSetterT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<number, NumberSetterT>(preparedStore)
    return withMiddlewares as PreparedNumberStoreT
  }

  string = <DataT extends string>(initialValue: DataT): PreparedStringStoreT => {
    const store = new DatassStore<DataT>(initialValue as DataT)

    const set = ((value: DataT) => store.replaceState(value)) as StringSetterT
    set.fromEventTarget = setFromEventTargetValue(set)
    set.byAsync = createByAsync<DataT>(store)
    set.by = createSetBy<DataT>(store)
    set.reset = () => set(store.initialState)

    const preparedStore: PreparedStoreT<DataT, StringSetterT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<string, StringSetterT>(preparedStore)
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

    set.lookup = (path: string, value) => {
      const stringPath = typeof path === 'number' ? `${path}` : path

      store.replaceState((draft) => {
        safeSet(draft, stringPath, value)
      })
    }

    const preparedStore: PreparedStoreT<DataT[], ArraySetterT<DataT>> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<DataT[], ArraySetterT<DataT>>(preparedStore)
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

    const preparedStore: PreparedStoreT<DataT, ObjectSetterT<DataT>> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    const withMiddlewares = this.applyMiddlewares<DataT, ObjectSetterT<DataT>>(preparedStore)
    return withMiddlewares as PreparedObjectStoreT<DataT>
  }

  withMiddleware = (...middlewares: InnerMiddlewareFunctionT[]) => {
    const _datass = new Datass()
    _datass.stagedMiddleware = middlewares
    return _datass
  }

  private applyMiddlewares<DataT, SetT extends BaseSetterT<DataT>>(preparedStore: PreparedStoreT<DataT, SetT>): PreparedStoreT<DataT, SetT> {
    return this.stagedMiddleware.reduce((final, middleware) => {
      // @ts-ignore
      const storeWithMiddlewareApplied = middleware(final) as PreparedStoreT<DataT, SetT>
      return storeWithMiddlewareApplied
    }, preparedStore)
  }
}

export class DatassStore<StateT> {
  initialState: StateT
  currentState: StateT
  previousState: StateT
  subscribers = new Map<string, SubscriberT<StateT>>()

  watchers: Map<
    string,
    {
      selector?: (state: StateT) => any
      reaction: (oldValue: any, newValue: any) => void
      previousValue?: any
    }
  > = new Map()

  watch = (reactionOrOptions: WatchReactionT<StateT> | WatchOptionsT<StateT, any>) => {
    const id = crypto.randomUUID()

    if (typeof reactionOrOptions === 'function') {
      // Simple watcher with direct reaction
      this.watchers.set(id, {
        reaction: reactionOrOptions,
        previousValue: this.currentState
      })
    } else {
      // Watcher with selector
      const { selector, reaction } = reactionOrOptions
      const selectedValue = selector(this.currentState)

      this.watchers.set(id, {
        selector,
        reaction,
        previousValue: selectedValue
      })
    }

    // Return unsubscribe function
    return () => {
      this.watchers.delete(id)
    }
  }

  constructor(initialState: StateT) {
    this.initialState = initialState
    this.currentState = initialState
    this.previousState = initialState
    return this
  }

  public get state() {
    return this.currentState
  }

  unsubscribe = (id: string) => {
    this.subscribers.delete(id)
  }

  subscribe = (subscriber: SubscriberT<StateT>) => {
    this.subscribers.set(subscriber.id, subscriber)
    return () => this.unsubscribe(subscriber.id)
  }

  replaceState = (newStateOrUpdater: StateT | DraftFnT<StateT>) => {
    const isFunction = typeof newStateOrUpdater === 'function'
    let newState: StateT

    if (isFunction) {
      const drafter = newStateOrUpdater as DraftFnT<StateT>
      newState = produce(this.currentState, drafter)
    }

    if (!isFunction) newState = newStateOrUpdater
    // no update if state hasn't changed
    if (newState === this.currentState) return
    const oldState = this.currentState
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

    // Notify all watchers about the state change
    this.watchers.forEach((watcher, id) => {
      if (watcher.selector) {
        // For watchers with selectors
        const newSelectedValue = watcher.selector(newState)
        const oldSelectedValue = watcher.previousValue

        if (newSelectedValue !== oldSelectedValue) {
          watcher.reaction(oldSelectedValue, newSelectedValue)
          watcher.previousValue = newSelectedValue
        }
      } else {
        // For watchers tracking the full state
        watcher.reaction(oldState, newState)
        watcher.previousValue = newState
      }
    })
  }
}

const datass = new Datass()
export { datass }
