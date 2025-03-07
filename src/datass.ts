import { useState, useEffect, useMemo } from "react"
import safeGet from "just-safe-get"
import { nanoid } from "nanoid"
//! DATASS v0.0.7

const useId = () => {
  return useMemo(() => nanoid(), [])
}

type SubscriberT = {
  id: string
  update: (newState: any) => void
  derive?: (newState: any) => any
  previousValue: any
}

const datMainAss = {
  stores: new Map(),
}

function createInternals<T>(initialState: T) {
  const internals: InternalsT<T> = {
    id: datMainAss.stores.size,
    currentState: initialState,
    previousState: null,
    subscribers: new Map(),

    get state() {
      return internals.currentState
    },

    use(selector?: (state: T) => any) {
      const id = useId()

      const initialValue = selector
        ? selector(internals.state)
        : internals.state

      const [value, setValue] = useState(initialValue)

      useEffect(() => {
        return internals.subscribe({
          derive: selector,
          previousValue: value,
          update: setValue,
          id,
        })
      }, [id, selector])

      return value
    },

    unsubscribe(id: string) {
      internals.subscribers.delete(id)
    },

    subscribe(subscriber: SubscriberT) {
      internals.subscribers.set(subscriber.id, subscriber)
      return () => internals.unsubscribe(subscriber.id)
    },

    replaceState(newState: T) {
      if (newState === internals.currentState) return // Skip if state hasn't changed

      internals.previousState = internals.currentState
      internals.currentState = newState

      internals.subscribers.forEach((subscriber) => {
        if (subscriber.derive) {
          const newResult = subscriber.derive(newState)
          const areEqual = areArrayItemsEqual(
            subscriber.previousValue,
            newResult
          )

          if (!areEqual) {
            subscriber.update(newResult)
            subscriber.previousValue = newResult
          }
        } else if (subscriber.previousValue !== newState) {
          subscriber.update(newState)
          subscriber.previousValue = newState
        }
      })
    },
  }

  datMainAss.stores.set(internals.id, internals)
  return internals
}

type InternalsT<T> = {
  id: number
  currentState: T
  previousState: T | null
  subscribers: Map<string, SubscriberT>
  get state(): T
  use(): T
  replaceState: (newState: T) => void
  subscribe: (subscriber: SubscriberT) => () => void
  unsubscribe: (id: string) => void
}

const datBoolean = (initialState: boolean) => {
  const internals = createInternals(initialState)

  const toggle = (value?: boolean) => {
    internals.replaceState(value ?? !internals.state)
  }

  return getFinalStore({ internals, toggle })
}

type GetFinalStoreOptionsT = {
  [key: string]: any
}

type EventTargetWithValue = EventTarget & { value: any }

interface EventWithTargetValue extends Event {
  target: EventTargetWithValue;
}

const getFinalStore = <T>(options: GetFinalStoreOptionsT): DatassStoreT<T> => {
  const { internals, ...rest } = options;

  const identify = (name: string) => {
    const datassAssociation = datMainAss.stores.get(internals.id);
    datMainAss.stores.delete(internals.id);
    datMainAss.stores.set(name, datassAssociation);
  };

  const setFromEvent = (event: EventWithTargetValue | any) => {
    const target = (event?.target || { value: "" }) as any;
    internals.replaceState(target.value);
  };

  return {
    identify,
    use: internals.use,
    set: internals.replaceState,
    setFromEvent, // Ensure this is included
    ...rest,
    get state() {
      return internals.state;
    },
  };
};


const datNumber = (initialState: number) => {
  const internals = createInternals(initialState)

  const increment = () => {
    internals.replaceState(internals.state + 1)
  }

  const decrement = () => {
    internals.replaceState(internals.state - 1)
  }

  return getFinalStore({ internals, increment, decrement })
}

const datString = (initialState: string) => {
  const internals = createInternals(initialState)
  return getFinalStore({ internals })
}

const datArray = <T>(initialState: T[]) => {
  const internals = createInternals<T[]>(initialState)

  const useFilter = (filterCallback: (item: T) => boolean) => {
    const id = useId()
    const initialResult = internals.state.filter(filterCallback)
    const [value, setValue] = useState(initialResult)

    useEffect(() => {
      const derive = (newState: T[]): any[] => {
        return newState.filter(filterCallback)
      }

      return internals.subscribe({
        previousValue: value,
        update: setValue,
        derive,
        id,
      })
    }, [])

    return value
  }

  const useMap = (mapCallback: (item: T) => any) => {
    const id = useId()
    const initialResult = internals.state.map(mapCallback)
    const [value, setValue] = useState(initialResult)

    useEffect(() => {
      const derive = (newState: T[]): any[] => {
        return newState.map(mapCallback)
      }

      return internals.subscribe({
        id,
        previousValue: value,
        update: setValue,
        derive,
      })
    }, [])

    return value
  }

  return getFinalStore({ internals, useFilter, useMap })
}

// Helper function to compare array items
const areArrayItemsEqual = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
}

const datObject = <T>(initialState: T) => {
  const internals = createInternals<T>(initialState)

  const usePartial = (path: string) => {
    const id = useId()
    const initialResult = safeGet(internals.state as any, path)
    const [value, setValue] = useState(initialResult)

    useEffect(() => {
      const derive = (newState: T[]): any[] => {
        return safeGet(newState, path)
      }

      return internals.subscribe({
        id,
        previousValue: value,
        update: setValue,
        derive,
      })
    }, [])

    return value
  }

  const finalStore = getFinalStore({ internals, usePartial })
  return finalStore as unknown as DatassStoreT<T> & DatassObjectStoreT
}

type DatassStoreT<T> = {
  use: {
    (): T
    <T>(selector: (state: T) => any): any
  }

  set: (newState: T) => void
  setFromEvent: (event: EventWithTargetValue) => void
  identify: (name: string) => void
  state: T
}

type DatassObjectStoreT = {
  usePartial: <T>(path: string) => T
}

export const datass = {
  boolean: datBoolean,
  number: datNumber,
  string: datString,
  array: datArray,
  object: datObject,
}

// const foo = datass.string('a')

// const input = document.createElement('input')
// input.addEventListener('change', event => {
//   foo.setFromEvent(event)
// })
