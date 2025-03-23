import { useState, useEffect, useMemo } from 'react'
import safeGet from 'just-safe-get'
import safeSet from 'just-safe-set'
import { nanoid } from 'nanoid'

// ==========================================
// Type Definitions
// ==========================================

/**
 * Represents any object with string keys
 */
type AnyObject = { [key: string]: any }

/**
 * Function that filters items in a collection
 */
type FilterFunction<DataType> = (item: DataType) => boolean

/**
 * Function that modifies a number value
 */
type NumberModifier = (value: number) => number

/**
 * The core hook returned by all stores
 */
type UseHook<StateType> = {
  <ReturnType = StateType>(selector?: (state: StateType) => ReturnType): ReturnType
  (): StateType
}

/**
 * Represents a subscriber to state changes
 */
type Subscriber = {
  id: string
  update: (newState: any) => void
  derive?: (newState: any) => any
  previousValue: any
}

/**
 * Event object with a target value property
 */
type EventWithTargetValue = { target: { value: any } }

/**
 * Base store type that all specialized stores extend
 */
type BaseStore<StateType> = {
  identify: (name: string) => void
  use: UseHook<StateType>
  state: StateType
}

/**
 * Internal store implementation details
 */
type StoreInternals<StateType> = {
  id: number
  initialState: StateType
  currentState: StateType
  previousState: StateType | null
  subscribers: Map<string, Subscriber>
  replaceState: (newState: StateType) => void
  subscribe: (subscriber: Subscriber) => () => void
  unsubscribe: (id: string) => void
  use: UseHook<StateType>
  get state(): StateType
}

/**
 * Base state setter type with additional utility methods
 */
type StateSetterBase<StateType> = {
  (newState: StateType): void
  fromEvent: (event: EventWithTargetValue) => void
  reset: () => void
}

/**
 * Options for creating the final store object
 */
type FinalStoreOptions<StateType> = {
  internals: StoreInternals<StateType>
  setMethods?: Record<string, Function>
  useMethods?: Record<string, Function>
  [key: string]: any
}

// Specialized store types

/**
 * Store specialized for boolean values
 */
type BooleanStore = BaseStore<boolean> & {
  set: StateSetterBase<boolean> & { toggle: () => boolean }
}

/**
 * Store specialized for number values
 */
type NumberStore = BaseStore<number> & {
  set: StateSetterBase<number> & { add: NumberModifier; subtract: NumberModifier }
}

/**
 * Store specialized for string values
 */
type StringStore = BaseStore<string> & {
  set: StateSetterBase<string>
}

/**
 * Store specialized for array values
 */
type ArrayStore<DataType, StateType extends DataType[]> = BaseStore<StateType> & {
  set: StateSetterBase<StateType> & {
    filter: (filterCallback: FilterFunction<DataType>) => void
    map: <ResultType>(mapCallback: (item: DataType) => ResultType) => void
    merge: (newPartialState: StateType) => void
    prepend: (...args: DataType[]) => void
    append: (...args: DataType[]) => void
  }
  use: UseHook<StateType> & {
    map: <ResultType>(mapCallback: (item: DataType) => ResultType) => ResultType[]
    filter: (filterCallback: FilterFunction<DataType>) => DataType[]
  }
}

/**
 * Store specialized for object values
 */
type ObjectStore<StateType extends object> = BaseStore<StateType> & {
  set: StateSetterBase<StateType> & {
    merge: (newPartialState: AnyObject) => void
    deep: (path: string, value: any) => void
  }
  use: UseHook<StateType> & {
    deep: <ReturnType>(path: string) => ReturnType
  }
}

// ==========================================
// Core Implementation
// ==========================================

/**
 * Generate a stable ID for React components
 * @returns A unique string ID
 */
const useId = () => {
  return useMemo(() => nanoid(), [])
}

/**
 * Global registry of all store instances
 */
const storeRegistry = {
  stores: new Map<any, any>()
}

/**
 * Creates the internal implementation of a store
 * @param initialState - The initial state for the store
 * @returns The store internals object
 */
const createStoreInternals = <StateType>(initialState: StateType): StoreInternals<StateType> => {
  const internals: StoreInternals<StateType> = {
    initialState,
    id: storeRegistry.stores.size,
    currentState: initialState,
    previousState: null,
    subscribers: new Map<string, Subscriber>(),
    /**
     * Get the current state of the store
     */
    get state() {
      return internals.currentState
    },
    /**
     * React hook to access and subscribe to store state
     * @param selector - Optional function to select a portion of the state
     * @returns The selected state (or full state if no selector provided)
     */
    use(selector?: (state: StateType) => any) {
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
    /**
     * Remove a subscriber from the store
     * @param id - ID of the subscriber to remove
     */
    unsubscribe(id: string) {
      internals.subscribers.delete(id)
    },
    /**
     * Add a subscriber to the store
     * @param subscriber - Subscriber object
     * @returns Cleanup function to unsubscribe
     */
    subscribe(subscriber: Subscriber) {
      internals.subscribers.set(subscriber.id, subscriber)
      return () => internals.unsubscribe(subscriber.id)
    },
    /**
     * Replace the current state and notify subscribers
     * @param newState - New state to set
     */
    replaceState(newState: StateType) {
      // Skip update if state hasn't changed
      if (newState === internals.currentState) return

      internals.previousState = internals.currentState
      internals.currentState = newState

      // Notify all subscribers about the state change
      internals.subscribers.forEach((subscriber) => {
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

  // Register the new store
  storeRegistry.stores.set(internals.id, internals)

  return internals
}

/**
 * Creates the final store object with all methods and properties
 * @param options - Configuration options for the store
 * @returns The complete store object
 */
const createFinalStore = <StoreType extends BaseStore<any>, StateType = any>(
  options: FinalStoreOptions<StateType>
): StoreType => {
  const { internals, setMethods, useMethods, ...otherOptions } = options

  /**
   * Assign a name to the store for debugging
   * @param name - Name to identify the store
   */
  const identify = (name: string) => {
    const storeAssociation = storeRegistry.stores.get(internals.id)
    storeRegistry.stores.delete(internals.id)
    storeRegistry.stores.set(name, storeAssociation)
  }

  /**
   * Updates state from an event object
   * @param event - DOM event with target.value
   */
  const setFromEvent = (event: EventWithTargetValue) => {
    if (event === null) return
    const target = (event?.target || { value: '' }) as any
    internals.replaceState(target.value)
  }

  /**
   * Reset the store to its initial state
   */
  const setReset = () => {
    internals.replaceState(internals.initialState)
  }

  const replaceStateWithMethods: StateSetterBase<StateType> = Object.assign(internals.replaceState, {
    fromEvent: setFromEvent,
    reset: setReset
  })

  // Add custom setter methods if provided
  if (setMethods) {
    Object.entries(setMethods).forEach(([key, method]) => {
      ;(replaceStateWithMethods as any)[key] = method
    })
  }

  // Add custom use hook methods if provided
  if (useMethods) {
    Object.entries(useMethods).forEach(([key, method]) => {
      ;(internals.use as any)[key] = method
    })
  }

  // Create the final store object without internal implementation details

  const finalStore = {
    ...otherOptions,
    identify,
    use: internals.use,
    set: replaceStateWithMethods,
    get state() {
      return internals.state
    }
  }

  return finalStore as unknown as StoreType
}

// ==========================================
// Specialized Store Implementations
// ==========================================

/**
 * Create a store for boolean values with toggle functionality
 * @param initialState - Initial boolean value
 * @returns Boolean store
 */
const createBooleanStore = (initialState: boolean): BooleanStore => {
  const internals = createStoreInternals(initialState)

  /**
   * Toggle the boolean value
   * @returns The new toggled value
   */
  const setToggle = () => {
    const newState = !internals.state
    internals.replaceState(newState)
    return newState
  }

  const setMethods = {
    toggle: setToggle
  }

  return createFinalStore<BooleanStore, boolean>({ internals, setMethods }) as BooleanStore
}

/**
 * Create a store for number values with add/subtract functionality
 * @param initialState - Initial number value
 * @returns Number store
 */
const createNumberStore = (initialState: number): NumberStore => {
  const internals = createStoreInternals(initialState)
  /**
   * Add a value to the current number
   * @param modifier - Amount to add (defaults to 1)
   */
  const setAdd = (modifier: number = 1) => {
    internals.replaceState(internals.state + modifier)
  }

  /**
   * Subtract a value from the current number
   * @param modifier - Amount to subtract (defaults to 1)
   */
  const setSubtract = (modifier: number = 1) => {
    internals.replaceState(internals.state - modifier)
  }

  const setMethods = {
    add: setAdd,
    subtract: setSubtract
  }
  return createFinalStore<NumberStore, number>({ internals, setMethods }) as NumberStore
}

/**
 * Create a store for string values
 * @param initialState - Initial string value
 * @returns String store
 */
const createStringStore = (initialState: string): StringStore => {
  const internals = createStoreInternals(initialState)
  return createFinalStore<StringStore, string>({ internals }) as StringStore
}

/**
 * Create a store for array values with array-specific operations
 * @param initialState - Initial array (defaults to empty)
 * @returns Array store
 */
const createArrayStore = <DataType>(initialState: DataType[] = [] as DataType[]): ArrayStore<DataType, DataType[]> => {
  type StateType = DataType[]
  type StoreType = ArrayStore<DataType, StateType>
  const internals = createStoreInternals<StateType>(initialState)

  /**
   * React hook to get filtered array items
   * @param filterItems - Filter predicate function
   * @returns Filtered array
   */
  const useFilter = (filterItems: FilterFunction<DataType>) => {
    const id = useId()
    const initialResult = internals.state.filter(filterItems)
    const [value, update] = useState(initialResult)

    useEffect(() => {
      const derive = (newState: StateType): DataType[] => newState.filter(filterItems)
      const subscription = { previousValue: value, update, derive, id }
      return internals.subscribe(subscription)
    }, [id, filterItems]) // add filterItems to the dependency array

    return value
  }

  /**
   * React hook to get mapped array items
   * @param mapCallback - Map function for array items
   * @returns Mapped array
   */
  const useMap = <ReturnType>(mapCallback: (item: DataType) => ReturnType) => {
    const id = useId()
    const initialResult = internals.state.map(mapCallback)
    const [value, update] = useState(initialResult)

    useEffect(() => {
      const derive = (newState: StateType): ReturnType[] => newState.map(mapCallback)
      const subscription = { previousValue: value, update, derive, id }
      return internals.subscribe(subscription)
    }, [id, mapCallback]) // Add mapCallback to the dependency array

    return value
  }

  /**
   * Filter the array in place
   * @param filterCallback - Filter predicate function
   */
  const setFilter = (filterCallback: FilterFunction<DataType>) => {
    const filtered = internals.state.filter(filterCallback)
    internals.replaceState(filtered)
  }

  /**
   * Map the array in place
   * @param mapCallback - Map function for array items
   */
  const setMap = <ReturnType>(mapCallback: (item: DataType) => ReturnType) => {
    const mapped = internals.state.map(mapCallback)
    internals.replaceState(mapped as unknown as DataType[])
  }

  /**
   * Merge arrays together
   * @param newPartialState - Array to merge with current state
   */
  const setMerge = (newPartialState: StateType) => {
    internals.replaceState([...internals.state, ...newPartialState] as DataType[])
  }

  /**
   * Append items to the end of the array
   * @param newItems - Items to append
   */
  const setAppend = (...newItems: DataType[]) => {
    const newState = [...internals.state, ...newItems]
    internals.replaceState(newState as DataType[])
  }

  /**
   * Prepend items to the beginning of the array
   * @param newItems - Items to prepend
   */
  const setPrepend = (...newItems: DataType[]) => {
    const newState = [...newItems, ...internals.state]
    internals.replaceState(newState as DataType[])
  }

  const setMethods = {
    filter: setFilter,
    map: setMap,
    merge: setMerge,
    prepend: setPrepend,
    append: setAppend
  }

  const useMethods = {
    filter: useFilter,
    map: useMap
  }
  return createFinalStore<StoreType, StateType>({ internals, setMethods, useMethods }) as StoreType
}

/**
 * Create a store for object values with deep get/set functionality
 * @param initialState - Initial object value
 * @returns Object store
 */
const createObjectStore = <DataType extends object>(initialState: DataType): ObjectStore<DataType> => {
  type StateType = DataType
  const internals = createStoreInternals<StateType>(initialState)

  /**
   * React hook to get a deep property from the object
   * @param path - Dot notation path to the property
   * @returns The value at the specified path
   */
  const useDeep = <ReturnType>(path: string): ReturnType => {
    const id = useId()
    const initialResult = safeGet(internals.state as any, path)
    const [value, update] = useState(initialResult)

    useEffect(() => {
      const derive = (newState: StateType): ReturnType => safeGet(newState, path)
      const subscription = { previousValue: value, update, derive, id }
      return internals.subscribe(subscription)
    }, [id, path]) // Add path to the dependency array

    return value
  }

  /**
   * Merge object properties
   * @param newPartialState - Object to merge with current state
   */
  const setMerge = (newPartialState: Partial<DataType>) => {
    internals.replaceState({ ...internals.state, ...newPartialState } as DataType)
  }

  /**
   * Deep set a value in the object
   * @param path - Dot notation path to the property
   * @param value - Value to set at the specified path
   */
  const setDeep = (path: string, value: any) => {
    const newState = { ...internals.state }
    safeSet(newState as any, path, value)
    internals.replaceState(newState as DataType)
  }

  const setMethods = {
    merge: setMerge,
    deep: setDeep
  }

  const useMethods = {
    deep: useDeep
  }
  return createFinalStore<ObjectStore<DataType>, StateType>({ internals, setMethods, useMethods }) as ObjectStore<DataType>
}

export const datass = {
  boolean: createBooleanStore,
  number: createNumberStore,
  string: createStringStore,
  array: createArrayStore,
  object: createObjectStore
}
