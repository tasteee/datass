import { useState, useEffect, useMemo } from 'react'
import safeGet from 'just-safe-get'
import { nanoid } from 'nanoid'

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
 stores: new Map()
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
   const initialValue = selector ? selector(internals.state) : internals.state
   const [value, setValue] = useState(initialValue)

   useEffect(() => {
    return internals.subscribe({
     derive: selector,
     previousValue: value,
     update: setValue,
     id
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
     const areEqual = subscriber.previousValue === newResult

     if (!areEqual) {
      subscriber.update(newResult)
      subscriber.previousValue = newResult
     }
    } else if (subscriber.previousValue !== newState) {
     subscriber.update(newState)
     subscriber.previousValue = newState
    }
   })
  }
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
 use(selector?: (state: T) => any): any
 replaceState: (newState: T) => void
 subscribe: (subscriber: SubscriberT) => () => void
 unsubscribe: (id: string) => void
}

// Base store type
interface BaseStoreT<T> {
 identify: (name: string) => void
 use: {
  (): T
  <R>(selector: (state: T) => R): R
 }
 set: (newState: T) => void
 setFromEvent: (event: EventWithTargetValue) => void
 state: T
}

// Boolean store specific type
interface BooleanStoreT extends BaseStoreT<boolean> {
 setToggle: (value?: any) => boolean
}

// Number store specific type
interface NumberStoreT extends BaseStoreT<number> {
 setIncrement: () => void
 setDecrement: () => void
}

// String store specific type
interface StringStoreT extends BaseStoreT<string> {}

// Array store specific type
interface ArrayStoreT<T> extends BaseStoreT<T[]> {
 useFilter: (filterCallback: (item: T) => boolean) => T[]
 useMap: <R>(mapCallback: (item: T) => R) => R[]
 append: (item: T) => void
 prepend: (item: T) => void
}

// Object store specific type
interface ObjectStoreT<T extends object> extends BaseStoreT<T> {
 usePartial: <R>(path: string) => R
 merge: (newPartialState: Partial<T>) => void
}

type EventTargetWithValue = EventTarget & { value: any }
interface EventWithTargetValue extends Event {
 target: EventTargetWithValue
}

const getFinalStore = <_T, S extends BaseStoreT<any>>(options: { internals: InternalsT<any>; [key: string]: any }): S => {
 const { internals, ...rest } = options

 const identify = (name: string) => {
  const datassAssociation = datMainAss.stores.get(internals.id)
  datMainAss.stores.delete(internals.id)
  datMainAss.stores.set(name, datassAssociation)
 }

 const setFromEvent = (event: EventWithTargetValue | any) => {
  const target = (event?.target || { value: '' }) as any
  internals.replaceState(target.value)
 }

 return {
  identify,
  use: internals.use,
  set: internals.replaceState,
  setFromEvent,
  ...rest,
  get state() {
   return internals.state
  }
 } as unknown as S
}

const datBoolean = (initialState: boolean): BooleanStoreT => {
 const internals = createInternals(initialState)

 const setToggle = (value?: any) => {
  const newState = value ?? !internals.state
  internals.replaceState(!!newState)
  return !!newState
 }

 return getFinalStore<boolean, BooleanStoreT>({ internals, setToggle })
}

const datNumber = (initialState: number): NumberStoreT => {
 const internals = createInternals(initialState)

 const setIncrement = () => {
  internals.replaceState(internals.state + 1)
 }

 const setDecrement = () => {
  internals.replaceState(internals.state - 1)
 }

 return getFinalStore<number, NumberStoreT>({ internals, setIncrement, setDecrement })
}

const datString = (initialState: string): StringStoreT => {
 const internals = createInternals(initialState)
 return getFinalStore<string, StringStoreT>({ internals })
}

const datArray = <T>(initialState: T[] = [] as T[]): ArrayStoreT<T> => {
 const internals = createInternals<T[]>(initialState)

 // Override replaceState to bypass array equality checks
 internals.replaceState = (newState: T[]) => {
  internals.previousState = internals.currentState
  internals.currentState = newState

  internals.subscribers.forEach((subscriber) => {
   if (subscriber.derive) {
    const newResult = subscriber.derive(newState)
    subscriber.update(newResult)
    subscriber.previousValue = newResult
   } else {
    subscriber.update(newState)
    subscriber.previousValue = newState
   }
  })
 }

 const useFilter = (filterCallback: (item: T) => boolean) => {
  const id = useId()
  const initialResult = internals.state.filter(filterCallback)
  const [value, setValue] = useState(initialResult)

  useEffect(() => {
   const derive = (newState: T[]): T[] => {
    return newState.filter(filterCallback)
   }

   return internals.subscribe({
    previousValue: value,
    update: setValue,
    derive,
    id
   })
  }, [])

  return value
 }

 const useMap = <R>(mapCallback: (item: T) => R) => {
  const id = useId()
  const initialResult = internals.state.map(mapCallback)
  const [value, setValue] = useState(initialResult)

  useEffect(() => {
   const derive = (newState: T[]): R[] => {
    return newState.map(mapCallback)
   }

   return internals.subscribe({
    id,
    previousValue: value,
    update: setValue,
    derive
   })
  }, [])

  return value
 }

 // Add append method
 const append = (item: T) => {
  internals.replaceState([...internals.state, item])
 }

 // Add prepend method
 const prepend = (item: T) => {
  internals.replaceState([item, ...internals.state])
 }

 return getFinalStore<T[], ArrayStoreT<T>>({
  internals,
  useFilter,
  useMap,
  append,
  prepend
 })
}

const datObject = <T extends object>(initialState: T): ObjectStoreT<T> => {
 const internals = createInternals<T>(initialState)

 const usePartial = <R>(path: string): R => {
  const id = useId()
  const initialResult = safeGet(internals.state as any, path)
  const [value, setValue] = useState(initialResult)

  useEffect(() => {
   const derive = (newState: T): R => {
    return safeGet(newState, path)
   }

   return internals.subscribe({
    id,
    previousValue: value,
    update: setValue,
    derive
   })
  }, [])

  return value
 }

 // Add merge method
 const merge = (newPartialState: Partial<T>) => {
  internals.replaceState({ ...internals.state, ...newPartialState } as T)
 }

 return getFinalStore<T, ObjectStoreT<T>>({
  internals,
  usePartial,
  merge
 })
}

export const datass = {
 boolean: datBoolean,
 number: datNumber,
 string: datString,
 array: datArray,
 object: datObject
}
