import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
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

describe('datass state management', () => {
  describe('Initial state', () => {
    it('should initialize string store correctly', () => {
      const store = datass.string('foo')
      expect(store.state).toBe('foo')
    })

    it('should initialize number store correctly', () => {
      const store = datass.number(42)
      expect(store.state).toBe(42)
    })

    it('should initialize boolean store correctly', () => {
      const store = datass.boolean(true)
      expect(store.state).toBe(true)
    })

    it('should initialize array store correctly', () => {
      const store = datass.array<number>([1, 2, 3])
      expect(store.state).toEqual([1, 2, 3])
    })

    it('should initialize object store correctly', () => {
      type StateType = { foo: string; count: number }
      const store = datass.object<StateType>({ foo: 'bar', count: 5 })
      expect(store.state).toEqual({ foo: 'bar', count: 5 })
    })
  })

  describe('State updates', () => {
    it('should update string store state', () => {
      const store = datass.string('')
      store.set('updated')
      expect(store.state).toBe('updated')
    })

    it('should update number store state', () => {
      const store = datass.number(10)
      store.set(20)
      expect(store.state).toBe(20)
    })

    it('should update boolean store state', () => {
      const store = datass.boolean(false)
      store.set(true)
      expect(store.state).toBe(true)
    })

    it('should update array store state', () => {
      const store = datass.array([1, 2])
      store.set([3, 4, 5])
      expect(store.state).toEqual([3, 4, 5])
    })

    it('should update object store state', () => {
      const store = datass.object({ a: 1 })
      store.set({ b: 2 })
      expect(store.state).toEqual({ b: 2 })
    })
  })

  describe('React integration', () => {
    it('should trigger re-render when using store.use()', () => {
      const store = datass.string('initial')
      let value = renderHook(() => store.use())
      expect(value).toBe('initial')

      act(() => {
        store.set('updated')
      })

      value = renderHook(() => store.use())
      expect(value).toBe('updated')
    })
  })

  describe('Advanced operations', () => {
    it('should add and subtract from number stores', () => {
      const store = datass.number(0)
      store.set.add(1)
      expect(store.state).toBe(1)
      store.set.subtract(2)
      expect(store.state).toBe(-1)
    })

    it('should append and prepend items to array store', () => {
      const store = datass.array<number>([])
      store.set.append(1)
      expect(store.state).toEqual([1])
      store.set.prepend(5)
      expect(store.state).toEqual([5, 1])
    })

    it('should filter and map array store', () => {
      const store = datass.array<number>([1, 2, 3, 4])
      const filtered = renderHook(() => store.use.filter((num) => num > 2))
      const mapped = renderHook(() => store.use.map((num) => num * 2))
      expect(filtered).toEqual([3, 4])
      expect(mapped).toEqual([2, 4, 6, 8])
    })

    it('should merge object store state', () => {
      const store = datass.object({ a: 1, b: 2 })
      store.set.merge({ b: 3, c: 4 })
      expect(store.state).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should allow partial object selection with use.deep', () => {
      const store = datass.object({ nested: { value: 42, list: [0, 1, 2] } })
      const nestedValue = renderHook(() => store.use.deep('nested.value'))
      const listItem = renderHook(() => store.use.deep('nested.list.1'))
      expect(nestedValue).toBe(42)
      expect(listItem).toBe(1)
    })
  })

  describe('Additional features', () => {
    it('should handle event with target value in set.fromEvent', () => {
      const store = datass.string('initial')
      const mockEvent = { target: { value: 'new value' } }
      store.set.fromEvent(mockEvent)
      expect(store.state).toBe('new value')
    })

    it('should handle selector in use method', () => {
      const store = datass.object({ count: 10, name: 'test' })
      const count = renderHook(() => store.use((state) => state.count))
      expect(count).toBe(10)
    })

    it('should not update subscribers if state is the same', () => {
      const store = datass.string('test')
      let renderCount = 0

      renderHook(() => {
        store.use()
        renderCount++
      })

      expect(renderCount).toBe(1)

      act(() => {
        store.set('test') // Same value, should not trigger re-render
      })

      expect(renderCount).toBe(1)

      act(() => {
        store.set('different') // Different value, should trigger re-render
      })

      expect(renderCount).toBe(2)
    })
  })
})
