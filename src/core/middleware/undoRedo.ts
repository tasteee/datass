import { InnerMiddlewareFunctionT, PreparedStoreT, BaseSetterT, BaseUseT } from '../types'

interface UndoRedoOptions {
  maxHistory?: number
}

export const undoRedoMiddleware = (options: UndoRedoOptions = {}) => {
  const maxHistory = options.maxHistory ?? 50

  const inner: InnerMiddlewareFunctionT = (store) => {
    const history: any[] = []
    const redoStack: any[] = []

    const originalSet = store.set
    let isApplyingHistory = false

    const recordHistory = () => {
      if (!isApplyingHistory) {
        history.push(JSON.parse(JSON.stringify(store.state)))
        redoStack.length = 0 // Clear redo stack on new action

        if (history.length > maxHistory) {
          history.shift()
        }
      }
    }

    const wrappedSet = function (...args: any[]) {
      recordHistory()
      return originalSet.apply(this, args)
    }

    wrappedSet.undo = () => {
      if (history.length === 0) return
      redoStack.push(JSON.parse(JSON.stringify(store.state)))
      const previousState = history.pop()
      isApplyingHistory = true
      store.set(previousState)
      isApplyingHistory = false
    }

    wrappedSet.redo = () => {
      if (redoStack.length === 0) return
      history.push(JSON.parse(JSON.stringify(store.state)))
      const nextState = redoStack.pop()
      isApplyingHistory = true
      store.set(nextState)
      isApplyingHistory = false
    }

    wrappedSet.reset = originalSet.reset
    wrappedSet.byAsync = originalSet.byAsync
    wrappedSet.by = originalSet.by

    return {
      ...store,
      set: wrappedSet
    } as any
  }

  return inner
}
