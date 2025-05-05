import { PreparedStoreT } from '../global'

type OptionsT = {
  maxHistory?: number
}

const DEFAULT_OPTIONS = {
  maxHistory: 50
}

export const undoRedoMiddleware = (options: OptionsT = {}) => {
  const settings = { ...DEFAULT_OPTIONS, ...options }

  type EnhancedSetT<StoreT extends { set: any }> = StoreT['set'] & {
    (arg: any): void
    replace?: any
    clearHistory: () => void
    getHistorySize: () => { past: number, future: number }
    canUndo: () => boolean
    canRedo: () => boolean
    redo: () => void
    undo: () => void
  }


  return <DataT, StoreT extends PreparedStoreT<DataT>>(store: StoreT): StoreT => {
    type InnerEnhancedSet = EnhancedSetT<StoreT>

    type EnhancedStoreT = StoreT & {
      set: InnerEnhancedSet 
    }

    const originalSet = store.set as InnerEnhancedSet

    // Only object stores have set.replace method.
    // Any other store uses set method to replace state.
    const replaceState = originalSet?.replace || store.set

    // Store history
    const history: DataT[] = []
    const future: DataT[] = []

    // Replace the set function with our wrapped version
    const enhancedSet = (arg: any) => {
      // Save current state to history before changing
      history.push(store.state)

      // Limit history size
      if (history.length > settings.maxHistory) {
        history.shift() // Remove oldest item
      }

      future.length = 0 // Clear future states when a new change occurs

      return originalSet(arg)
    }

    // store.set = enhancedSet as EnhancedSetT

    // Preserve all the original methods on the set function
    for (const key in originalSet) {
      if (key !== 'undo' && key !== 'redo' && Object.prototype.hasOwnProperty.call(originalSet, key)) {
        const originalMethod = originalSet[key]

        enhancedSet[key] = (...args: any[]) => {
          // Save current state to history before changing
          history.push(store.state)

          // Limit history size
          if (history.length > settings.maxHistory) {
            history.shift() // Remove oldest item
          }

          future.length = 0 // Clear future states when a new change occurs

          return originalMethod(...args)
        }
      }
    }

    // Add undo/redo functionality
    enhancedSet.undo = () => {
      if (history.length > 0) {
        const previousState = history.pop()!
        future.push(store.state)

        // Limit future size too
        if (future.length > settings.maxHistory) {
          future.shift()
        }

        replaceState(previousState)
      }
    }

    enhancedSet.redo = () => {
      if (future.length > 0) {
        const nextState = future.pop()!
        history.push(store.state)

        // Limit history size
        if (history.length > settings.maxHistory) {
          history.shift()
        }

        replaceState(nextState)
      }
    }

    // Add methods to check if undo/redo are available
    enhancedSet.canUndo = () => history.length > 0
    enhancedSet.canRedo = () => future.length > 0

    // Method to get history/future state counts
    enhancedSet.getHistorySize = () => {
      return {
        past: history.length,
        future: future.length
      }
    }

    // Method to clear history
    enhancedSet.clearHistory = () => {
      history.length = 0
      future.length = 0
    }

    store.set = enhancedSet as InnerEnhancedSet
    return store as EnhancedStoreT
  }
}
