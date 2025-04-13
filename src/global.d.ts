import { DatassStore } from './datass'

export type SetterT = {
  (value: any): void
  replace?: (value: any) => void
}

export type MiddlewareFunctionT = <OptionsT>(options: OptionsT) => InnerMiddlewareFunctionT
export type InnerMiddlewareFunctionT = <DataT, StoreT extends PreparedStoreT<DataT>>(store: StoreT) => StoreT

export type SubscriberT<DataT> = {
  id: string
  update: (newState: DataT) => void
  derive?: (newState: DataT) => any
  previousValue: DataT
}

export type PreparedStoreT<DataT> = {
  set: SetterT
  use: any // replace any with the actual type if possible, based on your usage
  state: DataT
  store: DatassStore<DataT>
}

export type PreparedBooleanStoreT = PreparedStoreT<boolean>
export type PreparedNumberStoreT = PreparedStoreT<number>
export type PreparedStringStoreT = PreparedStoreT<string>
export type PreparedArrayStoreT<DataT> = PreparedStoreT<DataT[]>
export type PreparedObjectStoreT<DataT> = PreparedStoreT<DataT>

export type DrafterT<DataT> = (draft: DataT) => void | DataT
export type AsyncSetterT<DataT> = (state: DataT) => Promise<DrafterT<DataT> | DataT>

export type BooleanDrafterT = DrafterT<boolean>
export type NumberDrafterT = DrafterT<number>
export type StringDrafterT = DrafterT<string>
export type ArrayDrafterT<DataT> = DrafterT<DataT[]>
export type ObjectDrafterT<DataT> = DrafterT<DataT>
