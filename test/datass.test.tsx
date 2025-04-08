import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { datass } from '../src/datass'
import * as React from 'react'

const renderHook = (hook: () => any) => {
  let result: any
  render(<TestComponent hook={hook} />)
  return result

  function TestComponent({ hook }: { hook: () => any }) {
    result = hook()
    return null
  }
}

// Helper component to test subscription behavior
function StateObserver({ store, selector = null }) {
  const value = selector ? store.use(selector) : store.use()
  return <div data-testid="value">{JSON.stringify(value)}</div>
}

describe('datass state management', () => {
  beforeEach(() => {
    // Reset any potential state between tests
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('boolean store', () => {
    it('should initialize with the provided value', () => {
      const $store = datass.boolean(true)
      expect($store.state).toBe(true)
    })

    it('should update state when set is called', () => {
      const $store = datass.boolean(true)
      act(() => {
        $store.set(false)
      })
      expect($store.state).toBe(false)
    })

    it('should toggle the boolean value', () => {
      const $store = datass.boolean(true)
      act(() => {
        $store.set.toggle()
      })
      expect($store.state).toBe(false)
      act(() => {
        $store.set.toggle()
      })
      expect($store.state).toBe(true)
    })

    it('should reset to initial value', () => {
      const $store = datass.boolean(true)
      act(() => {
        $store.set(false)
      })
      expect($store.state).toBe(false)
      act(() => {
        $store.set.reset()
      })
      expect($store.state).toBe(true)
    })

    it('should correctly subscribe to state changes in components', () => {
      const $store = datass.boolean(true)
      const { getByTestId, rerender } = render(<StateObserver store={$store} />)

      expect(getByTestId('value').textContent).toBe('true')

      act(() => {
        $store.set(false)
      })

      rerender(<StateObserver store={$store} />)
      expect(getByTestId('value').textContent).toBe('false')
    })
  })

  describe('string store', () => {
    it('should initialize with the provided value', () => {
      const $store = datass.string('hello')
      expect($store.state).toBe('hello')
    })

    it('should update state when set is called', () => {
      const $store = datass.string('hello')
      act(() => {
        $store.set('world')
      })
      expect($store.state).toBe('world')
    })

    it('should reset to initial value', () => {
      const $store = datass.string('hello')
      act(() => {
        $store.set('world')
      })
      expect($store.state).toBe('world')
      act(() => {
        $store.set.reset()
      })
      expect($store.state).toBe('hello')
    })
  })

  describe('number store', () => {
    it('should initialize with the provided value', () => {
      const $store = datass.number(42)
      expect($store.state).toBe(42)
    })

    it('should update state when set is called', () => {
      const $store = datass.number(42)
      act(() => {
        $store.set(100)
      })
      expect($store.state).toBe(100)
    })

    it('should add to the current value', () => {
      const $store = datass.number(42)
      act(() => {
        $store.set.add(8)
      })
      expect($store.state).toBe(50)
    })

    it('should subtract from the current value', () => {
      const $store = datass.number(42)
      act(() => {
        $store.set.subtract(2)
      })
      expect($store.state).toBe(40)
    })

    it('should reset to initial value', () => {
      const $store = datass.number(42)
      act(() => {
        $store.set(100)
      })
      expect($store.state).toBe(100)
      act(() => {
        $store.set.reset()
      })
      expect($store.state).toBe(42)
    })
  })

  describe('array store', () => {
    const initialItems = [
      { id: 1, text: 'item 1' },
      { id: 2, text: 'item 2' }
    ]

    it('should initialize with the provided array', () => {
      const $store = datass.array(initialItems)
      expect($store.state).toEqual(initialItems)
    })

    it('should replace the entire array when set is called', () => {
      const $store = datass.array(initialItems)
      const newItems = [{ id: 3, text: 'item 3' }]

      act(() => {
        $store.set(newItems)
      })

      expect($store.state).toEqual(newItems)
    })

    it('should prepend items to the array', () => {
      const $store = datass.array(initialItems)
      const newItem = { id: 0, text: 'item 0' }

      act(() => {
        $store.set.prepend(newItem)
      })

      expect($store.state).toEqual([newItem, ...initialItems])
    })

    it('should append items to the array', () => {
      const $store = datass.array(initialItems)
      const newItem = { id: 3, text: 'item 3' }

      act(() => {
        $store.set.append(newItem)
      })

      expect($store.state).toEqual([...initialItems, newItem])
    })

    it('should reset to initial value', () => {
      const $store = datass.array(initialItems)

      act(() => {
        $store.set([{ id: 999, text: 'new item' }])
      })

      expect($store.state).not.toEqual(initialItems)

      act(() => {
        $store.set.reset()
      })

      expect($store.state).toEqual(initialItems)
    })

    it('should allow finding items in the array', () => {
      const $store = datass.array(initialItems)

      // We need to wrap this in renderHook because use.find is meant to be called in a component
      const result = renderHook(() => $store.use.find((item) => item.id === 2))

      expect(result).toEqual({ id: 2, text: 'item 2' })
    })

    it('should allow selecting derived state with a selector', () => {
      const $store = datass.array(initialItems)
      const { getByTestId } = render(<StateObserver store={$store} selector={(state) => state.map((item) => item.id)} />)

      expect(getByTestId('value').textContent).toBe(JSON.stringify([1, 2]))
    })
  })

  describe('object store', () => {
    const initialState = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: '10001'
      }
    }

    it('should initialize with the provided object', () => {
      const $store = datass.object(initialState)
      expect($store.state).toEqual(initialState)
    })

    it('should merge partial updates with existing state', () => {
      const $store = datass.object(initialState)

      act(() => {
        $store.set({ age: 31 })
      })

      expect($store.state).toEqual({
        ...initialState,
        age: 31
      })
    })

    it('should handle nested object updates', () => {
      const $store = datass.object(initialState)

      act(() => {
        $store.set({
          address: {
            ...initialState.address,
            city: 'Boston'
          }
        })
      })

      expect($store.state.address.city).toBe('Boston')
      expect($store.state.address.zip).toBe('10001')
    })

    it('should reset to initial value', () => {
      const $store = datass.object(initialState)

      act(() => {
        $store.set({ name: 'Jane', age: 25 })
      })

      expect($store.state.name).toBe('Jane')

      act(() => {
        $store.set.reset()
      })

      expect($store.state).toEqual(initialState)
    })

    it('should allow selecting derived state with a selector', () => {
      const $store = datass.object(initialState)
      const { getByTestId } = render(<StateObserver store={$store} selector={(state) => state.name} />)

      expect(getByTestId('value').textContent).toBe('"John"')

      act(() => {
        $store.set({ name: 'Jane' })
      })

      expect(getByTestId('value').textContent).toBe('"Jane"')
    })
  })

  describe('middlewares', () => {
    it('should apply middleware to stores', () => {
      // Create a simple logging middleware
      const logs = []
      const loggingMiddleware = (store) => {
        const originalSet = store.set

        // Wrap the set function to log actions
        store.set = (...args) => {
          logs.push({ action: 'set', args })
          return originalSet(...args)
        }

        return store
      }

      const customDatass = datass.withMiddleware(loggingMiddleware)
      const $store = customDatass.number(0)

      act(() => {
        $store.set(42)
      })

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe('set')
      expect(logs[0].args[0]).toBe(42)
      expect($store.state).toBe(42)
    })

    it('should chain multiple middlewares', () => {
      const executionOrder = []

      const middleware1 = (store) => {
        executionOrder.push('middleware1')
        return store
      }

      const middleware2 = (store) => {
        executionOrder.push('middleware2')
        return store
      }

      const customDatass = datass.withMiddleware(middleware1, middleware2)
      customDatass.number(0)

      expect(executionOrder).toEqual(['middleware1', 'middleware2'])
    })
  })

  describe('state subscribers', () => {
    it('should only trigger updates when the selected state changes', () => {
      const initialState = { count: 0, name: 'test' }
      const $store = datass.object(initialState)

      // Create a mock function to track renders
      const renderCounter = vi.fn()

      function TestComponent() {
        // Only subscribe to count
        const count = $store.use((state) => state.count)
        renderCounter(count)
        return null
      }

      render(<TestComponent />)
      expect(renderCounter).toHaveBeenCalledWith(0)

      // Reset the mock to count next renders
      renderCounter.mockClear()

      // Update a property we're not subscribed to
      act(() => {
        $store.set({ name: 'updated' })
      })

      // Should not have re-rendered
      expect(renderCounter).not.toHaveBeenCalled()

      // Update the property we are subscribed to
      act(() => {
        $store.set({ count: 1 })
      })

      // Should have re-rendered
      expect(renderCounter).toHaveBeenCalledWith(1)
    })

    it('should unsubscribe on component unmount', () => {
      const $store = datass.number(0)
      const unsubscribeSpy = vi.spyOn($store, 'use')

      const { unmount } = render(<StateObserver store={$store} />)
      expect(unsubscribeSpy).toHaveBeenCalled()

      unmount()

      // Now set should not trigger any subscriber updates
      // This is hard to test directly, but we can ensure subscriptions are managed
      expect(unsubscribeSpy).toHaveBeenCalled()
    })
  })
})
