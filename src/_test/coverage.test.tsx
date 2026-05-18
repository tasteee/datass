/**
 * Additional tests covering functionality not exercised by the existing test suites:
 *   - fromEventTarget (number / string)
 *   - array.set.lookup / object.set.lookup
 *   - object.set.replace
 *   - watch() unsubscribe return value
 *   - byAsync error path (returns false)
 *   - use.filter, use.map, use.lookup in React
 *   - undoRedo: canUndo / canRedo / getHistorySize / clearHistory
 *   - same-value set is a no-op (no subscriber notification)
 *   - withMiddleware creates an independent Datass instance
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import * as React from 'react'
import { datass as coreDatass } from '../datass'
import { datass } from '../reactDatass'
import { renderHook } from './helpers'

afterEach(() => {
  cleanup()
})

// ---------------------------------------------------------------------------
// fromEventTarget
// ---------------------------------------------------------------------------

describe('number store – fromEventTarget', () => {
  const makeInputEvent = (value: string): Event => {
    const input = document.createElement('input')
    input.value = value
    return { target: input } as unknown as Event
  }

  it('sets state from an input event value (number coercion)', () => {
    const $store = datass.number(0)
    act(() => {
      $store.set.fromEventTarget(makeInputEvent('42'))
    })
    expect($store.state).toBe(42)
  })

  it('does not update state when event or target is missing', () => {
    const $store = datass.number(10)
    // event without target
    act(() => {
      $store.set.fromEventTarget({} as Event)
    })
    expect($store.state).toBe(10)
  })
})

describe('string store – fromEventTarget', () => {
  const makeInputEvent = (value: string): Event => {
    const input = document.createElement('input')
    input.value = value
    return { target: input } as unknown as Event
  }

  it('sets state from an input event value', () => {
    const $store = datass.string('')
    act(() => {
      $store.set.fromEventTarget(makeInputEvent('hello'))
    })
    expect($store.state).toBe('hello')
  })

  it('does not update state when event has no target', () => {
    const $store = datass.string('original')
    act(() => {
      $store.set.fromEventTarget({} as Event)
    })
    expect($store.state).toBe('original')
  })
})

// ---------------------------------------------------------------------------
// array.set.lookup
// ---------------------------------------------------------------------------

describe('array store – set.lookup', () => {
  it('updates a nested value inside an array element by dot-path', () => {
    const $store = datass.array([
      { id: 1, text: 'a' },
      { id: 2, text: 'b' }
    ])
    act(() => {
      $store.set.lookup('0.text', 'updated')
    })
    expect($store.state[0].text).toBe('updated')
    expect($store.state[1].text).toBe('b')
  })

  it('accepts a numeric index as path', () => {
    const $store = datass.array<number>([10, 20, 30])
    act(() => {
      // numeric path converted internally to string
      $store.set.lookup('1', 99)
    })
    expect($store.state[1]).toBe(99)
  })
})

// ---------------------------------------------------------------------------
// object.set.lookup
// ---------------------------------------------------------------------------

describe('object store – set.lookup', () => {
  it('updates a nested value by dot-path', () => {
    const $store = datass.object({ user: { name: 'Alice', age: 30 } })
    act(() => {
      $store.set.lookup('user.name', 'Bob')
    })
    expect($store.state.user.name).toBe('Bob')
    expect($store.state.user.age).toBe(30)
  })

  it('creates intermediate keys when they do not exist', () => {
    const $store = datass.object<any>({ a: 1 })
    act(() => {
      $store.set.lookup('b.c', 42)
    })
    expect(($store.state as any).b.c).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// object.set.replace
// ---------------------------------------------------------------------------

describe('object store – set.replace', () => {
  it('fully replaces state (does not merge)', () => {
    const $store = datass.object({ x: 1, y: 2 })
    act(() => {
      $store.set.replace({ x: 99, y: 2 })
    })
    expect($store.state).toEqual({ x: 99, y: 2 })
  })

  it('replaces with an entirely new shape (old keys gone)', () => {
    const $store = datass.object<any>({ a: 1, b: 2 })
    act(() => {
      $store.set.replace({ c: 3 })
    })
    expect($store.state).toEqual({ c: 3 })
    expect(($store.state as any).a).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// watch – unsubscribe
// ---------------------------------------------------------------------------

describe('watch – unsubscribe', () => {
  it('stops reacting after the returned unsubscribe is called', () => {
    const $store = datass.number(0)
    let ticks = 0
    const unsubscribe = $store.watch(() => ticks++)

    $store.set(1)
    expect(ticks).toBe(1)

    unsubscribe()

    $store.set(2)
    $store.set(3)
    expect(ticks).toBe(1) // no additional ticks
  })

  it('stops selector-based watcher after unsubscribe', () => {
    const $store = datass.object({ count: 0, name: 'a' })
    let ticks = 0
    const unsubscribe = $store.watch({
      selector: (s) => s.count,
      reaction: () => ticks++
    })

    $store.set({ count: 1 })
    expect(ticks).toBe(1)

    unsubscribe()

    $store.set({ count: 2 })
    expect(ticks).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// byAsync – error path
// ---------------------------------------------------------------------------

describe('byAsync – error handling', () => {
  it('returns false and does not update state when async updater throws', async () => {
    const $store = datass.number(5)
    const result = await $store.set.byAsync(async () => {
      throw new Error('async failure')
    })
    expect(result).toBe(false)
    expect($store.state).toBe(5)
  })

  it('returns false for object store when async updater throws', async () => {
    const $store = datass.object({ value: 'original' })
    const result = await $store.set.byAsync(async () => {
      throw new Error('async failure')
    })
    expect(result).toBe(false)
    expect($store.state.value).toBe('original')
  })
})

// ---------------------------------------------------------------------------
// same-value set is a no-op
// ---------------------------------------------------------------------------

describe('same-value set – no-op', () => {
  it('does not notify subscribers when primitive value is unchanged', () => {
    const $store = datass.number(42)
    const subscriber = vi.fn()
    $store.watch(subscriber)

    $store.set(42) // same value
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('does not notify subscribers when boolean value is unchanged', () => {
    const $store = datass.boolean(true)
    const subscriber = vi.fn()
    $store.watch(subscriber)

    $store.set(true) // same value
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('does not notify subscribers when string value is unchanged', () => {
    const $store = datass.string('hello')
    const subscriber = vi.fn()
    $store.watch(subscriber)

    $store.set('hello') // same value
    expect(subscriber).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// withMiddleware – creates independent instance
// ---------------------------------------------------------------------------

describe('withMiddleware – independent instance', () => {
  it('does not apply middleware to the global datass instance', () => {
    const applied: string[] = []
    const middleware = (store: any) => {
      applied.push('applied')
      return store
    }

    const customDatass = coreDatass.withMiddleware(middleware)
    customDatass.number(0)
    expect(applied).toEqual(['applied'])

    // Creating a store on the global instance should NOT trigger the middleware
    applied.length = 0
    coreDatass.number(0)
    expect(applied).toEqual([])
  })

  it('stores from different withMiddleware instances are independent', () => {
    const middleware1Applied: string[] = []
    const middleware2Applied: string[] = []

    const m1 = (store: any) => {
      middleware1Applied.push('m1')
      return store
    }
    const m2 = (store: any) => {
      middleware2Applied.push('m2')
      return store
    }

    const d1 = coreDatass.withMiddleware(m1)
    const d2 = coreDatass.withMiddleware(m2)

    d1.string('a')
    expect(middleware1Applied).toEqual(['m1'])
    expect(middleware2Applied).toEqual([])

    d2.string('b')
    expect(middleware1Applied).toEqual(['m1'])
    expect(middleware2Applied).toEqual(['m2'])
  })
})

// ---------------------------------------------------------------------------
// React: use.filter
// ---------------------------------------------------------------------------

describe('React – use.filter', () => {
  it('filters array items reactively', () => {
    const $store = datass.array([1, 2, 3, 4, 5])

    function Comp() {
      const evens = $store.use.filter((n: number) => n % 2 === 0)
      return <div data-testid="v">{JSON.stringify(evens)}</div>
    }

    render(<Comp />)
    expect(screen.getByTestId('v').textContent).toBe('[2,4]')

    act(() => $store.set.append(6))
    expect(screen.getByTestId('v').textContent).toBe('[2,4,6]')
  })
})

// ---------------------------------------------------------------------------
// React: use.map
// ---------------------------------------------------------------------------

describe('React – use.map', () => {
  it('maps array items reactively', () => {
    const $store = datass.array([1, 2, 3])

    function Comp() {
      const doubled = $store.use.map((n: number) => n * 2)
      return <div data-testid="v">{JSON.stringify(doubled)}</div>
    }

    render(<Comp />)
    expect(screen.getByTestId('v').textContent).toBe('[2,4,6]')

    act(() => $store.set.append(4))
    expect(screen.getByTestId('v').textContent).toBe('[2,4,6,8]')
  })
})

// ---------------------------------------------------------------------------
// React: use.lookup
// ---------------------------------------------------------------------------

describe('React – use.lookup (array)', () => {
  it('returns a nested value at a path', () => {
    const $store = datass.array([
      { id: 1, label: 'foo' },
      { id: 2, label: 'bar' }
    ])

    const result = renderHook(() => $store.use.lookup('0.label'))
    expect(result).toBe('foo')
  })

  it('returns fallback when path is absent', () => {
    const $store = datass.array<any>([{ id: 1 }])
    const result = renderHook(() => $store.use.lookup('0.missing', 'default'))
    expect(result).toBe('default')
  })
})

describe('React – use.lookup (object)', () => {
  it('returns a nested value at a dot-path', () => {
    const $store = datass.object({ user: { name: 'Alice' } })
    const result = renderHook(() => $store.use.lookup('user.name'))
    expect(result).toBe('Alice')
  })

  it('returns fallback when path is absent', () => {
    const $store = datass.object<any>({ a: 1 })
    const result = renderHook(() => $store.use.lookup('a.b.c', 'fallback'))
    expect(result).toBe('fallback')
  })
})

// ---------------------------------------------------------------------------
// undoRedo – canUndo / canRedo / getHistorySize / clearHistory
// ---------------------------------------------------------------------------

describe('undoRedo middleware – canUndo / canRedo / getHistorySize / clearHistory', () => {
  const enhanced = datass.withMiddleware(datass.middleware.undoRedo())

  it('canUndo returns false initially and true after a change', () => {
    const $store = enhanced.number(0)
    expect($store.set.canUndo()).toBe(false)
    $store.set(1)
    expect($store.set.canUndo()).toBe(true)
  })

  it('canRedo returns false initially and true after undo', () => {
    const $store = enhanced.number(0)
    expect($store.set.canRedo()).toBe(false)
    $store.set(1)
    $store.set.undo()
    expect($store.set.canRedo()).toBe(true)
  })

  it('canRedo returns false after a new change following undo', () => {
    const $store = enhanced.number(0)
    $store.set(1)
    $store.set.undo()
    $store.set(2)
    expect($store.set.canRedo()).toBe(false)
  })

  it('getHistorySize tracks past and future correctly', () => {
    const $store = enhanced.number(0)
    expect($store.set.getHistorySize()).toEqual({ past: 0, future: 0 })

    $store.set(1)
    $store.set(2)
    expect($store.set.getHistorySize()).toEqual({ past: 2, future: 0 })

    $store.set.undo()
    expect($store.set.getHistorySize()).toEqual({ past: 1, future: 1 })

    $store.set.redo()
    expect($store.set.getHistorySize()).toEqual({ past: 2, future: 0 })
  })

  it('clearHistory resets past and future to empty', () => {
    const $store = enhanced.number(0)
    $store.set(1)
    $store.set(2)
    $store.set.undo()

    expect($store.set.getHistorySize()).toEqual({ past: 1, future: 1 })
    $store.set.clearHistory()
    expect($store.set.getHistorySize()).toEqual({ past: 0, future: 0 })
    expect($store.set.canUndo()).toBe(false)
    expect($store.set.canRedo()).toBe(false)
  })

  it('canUndo returns false when undo exhausts all history', () => {
    const $store = enhanced.string('a')
    $store.set('b')
    $store.set('c')

    $store.set.undo()
    $store.set.undo()
    expect($store.set.canUndo()).toBe(false)
    expect($store.state).toBe('a')
  })
})
