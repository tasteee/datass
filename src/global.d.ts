import { DatassStore } from './datass'

export type WatchReactionT<T> = (oldValue: T, newValue: T) => void

export interface WatchOptionsT<T, S = T> {
  selector: (state: T) => S
  reaction: (oldValue: S, newValue: S) => void
}

// Base setter type with common methods
export type BaseSetterT<T> = {
  (value: T): void
  reset: () => void
  byAsync: (asyncUpdater: AsyncSetterT<T>) => Promise<boolean>
  by: (updaterFn: DrafterT<T>) => void
}

// Boolean Store Types
export type BooleanSetterT = BaseSetterT<boolean> & {
  toggle: () => void
}

// Number Store Types
export type NumberSetterT = BaseSetterT<number> & {
  add: (value: number) => void
  subtract: (value: number) => void
  fromEventTarget: (event: Event) => void
}

// String Store Types
export type StringSetterT<T extends string = string> = {
  (value: T): void
  reset: () => void
  byAsync: (asyncUpdater: AsyncSetterT<T>) => Promise<boolean>
  by: (updaterFn: DrafterT<T>) => void
  fromEventTarget: (event: Event) => void
}

// Array Store Types
export type ArraySetterT<T> = BaseSetterT<T[]> & {
  append: (...items: T[]) => void
  prepend: (...items: T[]) => void
}

// Object Store Types
export type ObjectSetterT<T extends object> = {
  (value: Partial<T>): void
  lookup: (path: string, value: any) => void
  replace: (value: T) => void
  reset: () => void
  byAsync: (asyncUpdater: AsyncSetterT<T>) => Promise<boolean>
  by: (updaterFn: DrafterT<T>) => void
}

// Base use type
export type BaseUseT<T> = {
  (selector?: (state: T) => any): any
}

export type ObjectUseT<T> = BaseUseT<T> & {
  lookup: <ValueT>(path: string, fallback?: ValueT) => ValueT
}

// Array use type with additional methods
export type ArrayUseT<T> = BaseUseT<T[]> & {
  map: <V>(mapper: (item: T) => V) => V[]
  find: (finder: (item: T) => boolean) => T | undefined
  filter: (filter: (item: T) => boolean) => T | undefined
}

// Generic prepared store type
export type PreparedStoreT<DataT, SetterType = BaseSetterT<DataT>, UseType = BaseUseT<DataT>> = {
  set: SetterType
  use: UseType
  state: DataT
  store: DatassStore<DataT>
  watch: (reactionOrOptions: WatchReactionT<DataT> | WatchOptionsT<DataT, any>) => () => void
}

// Specific prepared store types
export type PreparedBooleanStoreT = PreparedStoreT<boolean, BooleanSetterT, BaseUseT<boolean>>
export type PreparedNumberStoreT = PreparedStoreT<number, NumberSetterT, BaseUseT<number>>
export type PreparedStringStoreT<T extends string = string> = PreparedStoreT<T, StringSetterT<T>, BaseUseT<string>>
export type PreparedArrayStoreT<T> = PreparedStoreT<T[], ArraySetterT<T>, ArrayUseT<T>>
export type PreparedObjectStoreT<T extends object> = PreparedStoreT<T, ObjectSetterT<T>, ObjectUseT<T>>

// Middleware types
export type MiddlewareFunctionT = <OptionsT>(options: OptionsT) => InnerMiddlewareFunctionT
export type InnerMiddlewareFunctionT = <DataT, SetT extends BaseSetterT<DataT>, UseT extends BaseUseT<DataT>>(
  store: PreparedStoreT<DataT, SetT, UseT>
) => PreparedStoreT<DataT, SetT, UseT>

// Subscriber type
export type SubscriberT<DataT> = {
  id: string
  update: (newState: DataT) => void
  derive?: (newState: DataT) => any
  previousValue: DataT
}

// Drafter types
export type DrafterT<DataT> = (draft: DataT) => void | DataT
export type AsyncSetterT<DataT> = (state: DataT) => Promise<DrafterT<DataT> | DataT>
export type BooleanDrafterT = DrafterT<boolean>
export type NumberDrafterT = DrafterT<number>
export type StringDrafterT = DrafterT<string>
export type ArrayDrafterT<DataT> = DrafterT<DataT[]>
export type ObjectDrafterT<DataT> = DrafterT<DataT>
