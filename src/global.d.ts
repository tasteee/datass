import { DatassStore } from './datass'

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
  replace: (value: T) => void
  reset: () => void
  byAsync: (asyncUpdater: AsyncSetterT<T>) => Promise<boolean>
  by: (updaterFn: DrafterT<T>) => void
}

// Base use type
export type BaseUseT<T> = {
  (selector?: (state: T) => any): any
}

// Array use type with additional methods
export type ArrayUseT<T> = BaseUseT<T[]> & {
  find: (finder: (item: T) => boolean) => T | undefined
  filter: (filter: (item: T) => boolean) => T | undefined
}

// Generic prepared store type
export type PreparedStoreT<DataT, SetterType = BaseSetterT<DataT>, UseType = BaseUseT<DataT>> = {
  set: SetterType
  use: UseType
  state: DataT
  store: DatassStore<DataT>
}

// Specific prepared store types
export type PreparedBooleanStoreT = PreparedStoreT<boolean, BooleanSetterT>
export type PreparedNumberStoreT = PreparedStoreT<number, NumberSetterT>
export type PreparedStringStoreT<T extends string = string> = PreparedStoreT<T, StringSetterT<T>>
export type PreparedArrayStoreT<T> = PreparedStoreT<T[], ArraySetterT<T>, ArrayUseT<T>>
export type PreparedObjectStoreT<T extends object> = PreparedStoreT<T, ObjectSetterT<T>>

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