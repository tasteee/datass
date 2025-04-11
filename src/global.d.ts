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
