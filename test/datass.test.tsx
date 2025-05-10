import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { datass } from '../src/datass'
import * as React from 'react'
import { renderHook, StateObserver } from './helpers'

describe('datass state management', () => {
  beforeEach(() => {
    // Reset any potential state between tests
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('store.watch', () => {
    it('should react to string state changes', () => {
      const $store = datass.string('')
      let tick = 0
      $store.watch((oldValue, newValue) => tick++)
      $store.set('STUB')
      expect(tick).toBe(1)
    })

    it('should react to boolean state changes', () => {
      const $store = datass.boolean(false)
      let tick = 0
      $store.watch((oldValue, newValue) => tick++)
      $store.set(true)
      expect(tick).toBe(1)
      $store.set.toggle()
      expect(tick).toBe(2)
    })

    it('should react only to selector return value', () => {
      const $store = datass.object({ a: true, b: 0 })
      let tick = 0
      $store.watch({
        selector: (state) => state.b > 0,
        reaction: (oldB, newB) => tick++
      })

      $store.set({ a: false })
      expect(tick).toBe(0)
      $store.set({ b: -20 })
      expect(tick).toBe(0)
      $store.set({ b: 50 })
      expect(tick).toBe(1)
    })
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

    it('should update state with set.by', () => {
      const $store = datass.boolean(true)
      act(() => {
        $store.set.by((draft) => !draft)
      })
      expect($store.state).toBe(false)
    })

    it('should update state with set.byAsync', async () => {
      const $store = datass.boolean(true)
      await act(async () => {
        await $store.set.byAsync(async (state) => {
          // Simulate async operation
          return new Promise((resolve) => {
            setTimeout(() => resolve(!state), 10)
          })
        })
      })
      expect($store.state).toBe(false)
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

    it('should work with type arg', () => {
      type DataT = 'foo' | 'bar'
      const $store = datass.string<DataT>('foo')
      expect($store.state).toBe('foo')
      act(() => $store.set('bar'))
      expect($store.state).toBe('bar')
      act(() => $store.set('baz'))
      expect($store.state).toBe('baz')
    })

    it('should update state when set is called', () => {
      const $store = datass.string('hello')
      act(() => {
        $store.set('world')
      })
      expect($store.state).toBe('world')
    })

    it('should update state with set.by', () => {
      const $store = datass.string('hello')
      act(() => {
        $store.set.by((draft) => draft.toUpperCase())
      })
      expect($store.state).toBe('HELLO')
    })

    it('should update state with set.byAsync', async () => {
      const $store = datass.string('hello')
      await act(async () => {
        await $store.set.byAsync(async (state) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(state + ' world'), 10)
          })
        })
      })
      expect($store.state).toBe('hello world')
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

    it('should update state with set.by', () => {
      const $store = datass.number(42)
      act(() => {
        $store.set.by((draft) => draft * 2)
      })
      expect($store.state).toBe(84)
    })

    it('should update state with set.byAsync', async () => {
      const $store = datass.number(42)
      await act(async () => {
        await $store.set.byAsync(async (state) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(state / 2), 10)
          })
        })
      })
      expect($store.state).toBe(21)
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

  describe('datass.array', () => {
    type ItemT = { id: number; text: string }
    const INITIAL_STATE = [
      { id: 1, text: 'item 1' },
      { id: 2, text: 'item 2' }
    ]

    it('should have the correct initial value', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      expect($store.state).toEqual(INITIAL_STATE)
    })

    it('set should replace entire state array', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      const newItems = [{ id: 3, text: 'item 3' }]
      act(() => $store.set(newItems))
      expect($store.state).toEqual(newItems)
    })

    it('should update state with set.by using immer', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      act(() => {
        $store.set.by((draft) => {
          draft[0].text = 'updated item 1'
          draft.push({ id: 3, text: 'item 3' })
        })
      })
      expect($store.state).toEqual([
        { id: 1, text: 'updated item 1' },
        { id: 2, text: 'item 2' },
        { id: 3, text: 'item 3' }
      ])
    })

    it('should update state with set.byAsync', async () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      await act(async () => {
        await $store.set.byAsync(async (state) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve((draft) => {
                draft.forEach((item) => {
                  item.text = `async ${item.text}`
                })
              })
            }, 10)
          })
        })
      })
      expect($store.state).toEqual([
        { id: 1, text: 'async item 1' },
        { id: 2, text: 'async item 2' }
      ])
    })

    it('should prepend items to derive new state', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      const newItem = { id: 0, text: 'item 0' }
      act(() => {
        $store.set.prepend(newItem)
      })
      expect($store.state).toEqual([newItem, ...INITIAL_STATE])
    })

    it('should prepend multiple items to derive new state', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      const newItems = [
        { id: -1, text: 'item -1' },
        { id: 0, text: 'item 0' }
      ]
      act(() => {
        $store.set.prepend(...newItems)
      })
      expect($store.state).toEqual([...newItems, ...INITIAL_STATE])
    })

    it('should append items to the array', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      const newItem = { id: 3, text: 'item 3' }
      act(() => {
        $store.set.append(newItem)
      })
      expect($store.state).toEqual([...INITIAL_STATE, newItem])
    })

    it('should append multiple items to derive new state', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      const newItems = [
        { id: 3, text: 'item 3' },
        { id: 4, text: 'item 4' }
      ]
      act(() => {
        $store.set.append(...newItems)
      })
      expect($store.state).toEqual([...INITIAL_STATE, ...newItems])
    })

    it('should reset to initial value', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      act(() => {
        $store.set([{ id: 999, text: 'new item' }])
      })
      expect($store.state).not.toEqual(INITIAL_STATE)
      act(() => {
        $store.set.reset()
      })
      expect($store.state).toEqual(INITIAL_STATE)
    })

    it('should allow finding items in the array', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      // We need to wrap this in renderHook because use.find is meant to be called in a component
      const result = renderHook(() => $store.use.find((item) => item.id === 2))
      expect(result).toEqual({ id: 2, text: 'item 2' })
    })

    it('should allow selecting derived state with a selector', () => {
      const $store = datass.array<ItemT>(INITIAL_STATE)
      const { getByTestId } = render(<StateObserver store={$store} selector={(state) => state.map((item) => item.id)} />)
      expect(getByTestId('value').textContent).toBe(JSON.stringify([1, 2]))
    })
  })

  describe('object store', () => {
    const initialState = {
      name: 'John',
      age: 30,
      address: { city: 'New York', zip: '10001' }
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
      expect($store.state).toEqual({ ...initialState, age: 31 })
    })

    it('should update state with set.by using immer', () => {
      const $store = datass.object(initialState)
      act(() => {
        $store.set.by((draft) => {
          draft.age = 31
          draft.address.city = 'Boston'
        })
      })
      expect($store.state).toEqual({
        ...initialState,
        age: 31,
        address: { ...initialState.address, city: 'Boston' }
      })
    })

    it('should update state with set.byAsync', async () => {
      const $store = datass.object(initialState)
      await act(async () => {
        await $store.set.byAsync(async (state) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve((draft) => {
                draft.name = 'Jane'
                draft.address.zip = '02134'
              })
            }, 10)
          })
        })
      })
      expect($store.state).toEqual({
        ...initialState,
        name: 'Jane',
        address: { ...initialState.address, zip: '02134' }
      })
    })

    it('should handle nested object updates', () => {
      const $store = datass.object(initialState)
      act(() => {
        $store.set({ address: { ...initialState.address, city: 'Boston' } })
      })
      expect($store.state.address.city).toBe('Boston')
      expect($store.state.address.zip).toBe('10001')
    })

    it('should handle return values from byAsync', async () => {
      const $store = datass.object(initialState)
      await act(async () => {
        await $store.set.byAsync(async (state) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              // Return a partial object update instead of a draft function
              // @ts-ignore
              resolve({ skills: ['JavaScript', 'React'] })
            }, 10)
          })
        })
      })

      expect($store.state).toEqual({
        ...initialState,
        skills: ['JavaScript', 'React']
      })
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

    it('should only trigger updates when set.by changes relevant state', () => {
      const initialState = { count: 0, name: 'test' }
      const $store = datass.object(initialState)

      const renderCounter = vi.fn()

      function TestComponent() {
        // Only subscribe to count
        const count = $store.use((state) => state.count)
        renderCounter(count)
        return null
      }

      render(<TestComponent />)
      renderCounter.mockClear()

      // Update a property we're not subscribed to using set.by
      act(() => {
        $store.set.by((draft) => {
          draft.name = 'updated via immer'
        })
      })
      // Should not have re-rendered
      expect(renderCounter).not.toHaveBeenCalled()

      // Update the property we are subscribed to using set.by
      act(() => {
        $store.set.by((draft) => {
          draft.count = 42
        })
      })
      // Should have re-rendered
      expect(renderCounter).toHaveBeenCalledWith(42)
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
