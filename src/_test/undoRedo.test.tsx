import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import { datass } from '../reactDatass'
import * as React from 'react'
import { StateObserver } from './helpers'

describe('undoRedo middleware', () => {
  const undoRedoMiddleware = datass.middleware.undoRedo()
  const enhancedDatass = datass.withMiddleware(undoRedoMiddleware)

  afterEach(() => {
    cleanup()
  })

  it('should allow undoing and redoing number changes', () => {
    const $store = enhancedDatass.number(0)
    expect($store.state).toBe(0)

    $store.set.add(1)
    expect($store.state).toBe(1)

    $store.set.undo()
    expect($store.state).toBe(0)

    $store.set.redo()
    expect($store.state).toBe(1)
  })

  it('should handle multiple state changes and undo operations', () => {
    const $store = enhancedDatass.number(10)

    $store.set.add(5) // 15
    $store.set.add(10) // 25
    $store.set.subtract(3) // 22

    expect($store.state).toBe(22)

    $store.set.undo() // 25
    expect($store.state).toBe(25)

    $store.set.undo() // 15
    expect($store.state).toBe(15)

    $store.set.undo() // 10
    expect($store.state).toBe(10)

    // Should do nothing when history is empty
    $store.set.undo()
    expect($store.state).toBe(10)
  })

  it('should clear future states when a new change occurs after undo', () => {
    const $store = enhancedDatass.number(0)

    $store.set.add(10) // 10
    $store.set.add(20) // 30

    $store.set.undo() // 10
    expect($store.state).toBe(10)

    // Make a new change, which should clear the redo history
    $store.set.add(5) // 15
    expect($store.state).toBe(15)

    // Redo should do nothing now
    $store.set.redo()
    expect($store.state).toBe(15)
  })

  it('should work with string stores', () => {
    const $store = enhancedDatass.string('hello')

    $store.set('hello world')
    $store.set('hello wonderful world')

    expect($store.state).toBe('hello wonderful world')

    $store.set.undo()
    expect($store.state).toBe('hello world')

    $store.set.undo()
    expect($store.state).toBe('hello')

    $store.set.redo()
    expect($store.state).toBe('hello world')
  })

  it('should work with boolean stores', () => {
    const $store = enhancedDatass.boolean(false)

    $store.set(true)
    expect($store.state).toBe(true)

    $store.set.toggle() // false
    expect($store.state).toBe(false)

    $store.set.undo() // true
    expect($store.state).toBe(true)

    $store.set.undo() // false
    expect($store.state).toBe(false)

    $store.set.redo() // true
    $store.set.redo() // false
    expect($store.state).toBe(false)
  })

  it('should work with array stores', () => {
    const $store = enhancedDatass.array([1, 2, 3])

    $store.set.append(4, 5)
    expect($store.state).toEqual([1, 2, 3, 4, 5])

    $store.set.prepend(0)
    expect($store.state).toEqual([0, 1, 2, 3, 4, 5])

    $store.set.undo()
    expect($store.state).toEqual([1, 2, 3, 4, 5])

    $store.set.undo()
    expect($store.state).toEqual([1, 2, 3])

    $store.set.redo()
    expect($store.state).toEqual([1, 2, 3, 4, 5])
  })

  it('should work with object stores', () => {
    const $store = enhancedDatass.object({ name: 'John', age: 30 })

    $store.set({ age: 31 })
    expect($store.state).toEqual({ name: 'John', age: 31 })

    $store.set({ name: 'Johnny' })
    expect($store.state).toEqual({ name: 'Johnny', age: 31 })

    $store.set.undo()
    expect($store.state).toEqual({ name: 'John', age: 31 })

    $store.set.redo()
    expect($store.state).toEqual({ name: 'Johnny', age: 31 })
  })

  it('should handle set.by updater functions', () => {
    const $store = enhancedDatass.object({ count: 0, user: { name: 'Alice' } })

    $store.set.by((draft) => {
      draft.count += 1
      draft.user.name = 'Bob'
    })

    expect($store.state).toEqual({ count: 1, user: { name: 'Bob' } })

    $store.set.undo()
    expect($store.state).toEqual({ count: 0, user: { name: 'Alice' } })

    $store.set.redo()
    expect($store.state).toEqual({ count: 1, user: { name: 'Bob' } })
  })

  it('should work with React components', () => {
    const $store = enhancedDatass.number(0)

    render(<StateObserver store={$store} />)
    expect(screen.getByTestId('value').textContent).toBe('0')

    act(() => {
      $store.set(10)
    })
    expect(screen.getByTestId('value').textContent).toBe('10')

    act(() => {
      $store.set.undo()
    })
    expect(screen.getByTestId('value').textContent).toBe('0')

    act(() => {
      $store.set.redo()
    })
    expect(screen.getByTestId('value').textContent).toBe('10')
  })

  it('should work with selectors', () => {
    const $store = enhancedDatass.object({ user: { name: 'Alice', age: 25 } })

    const selector = (state) => state.user.name

    render(<StateObserver store={$store} selector={selector} />)
    expect(screen.getByTestId('value').textContent).toBe('"Alice"')

    act(() => {
      $store.set.by((draft) => {
        draft.user.name = 'Bob'
      })
    })
    expect(screen.getByTestId('value').textContent).toBe('"Bob"')

    act(() => {
      $store.set.undo()
    })
    expect(screen.getByTestId('value').textContent).toBe('"Alice"')
  })

  it('should handle async updates with set.byAsync', async () => {
    const $store = enhancedDatass.number(0)

    await $store.set.byAsync(async (state) => {
      // Simulating async operation
      return state + 5
    })

    expect($store.state).toBe(5)

    $store.set.undo()
    expect($store.state).toBe(0)

    $store.set.redo()
    expect($store.state).toBe(5)
  })

  it('should limit history if maxHistory is provided', () => {
    // This test assumes the middleware accepts a maxHistory option
    const limitedHistory = datass.middleware.undoRedo({ maxHistory: 2 })
    const limitedDatass = datass.withMiddleware(limitedHistory)

    const $store = limitedDatass.number(0)

    $store.set(1)
    $store.set(2)
    $store.set(3)
    $store.set(4)

    expect($store.state).toBe(4)

    $store.set.undo()
    expect($store.state).toBe(3)

    $store.set.undo()
    expect($store.state).toBe(2)

    // Should not be able to undo beyond the history limit
    $store.set.undo()
    expect($store.state).toBe(2)
  })
})
