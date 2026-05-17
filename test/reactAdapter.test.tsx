import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import * as React from 'react'
import { datass as coreDatass } from '../src/datass'
import { datass as reactDatass } from '../src/reactDatass'
import { StateObserver } from './helpers'

describe('react adapter', () => {
  it('keeps core stores framework agnostic before upgrade', () => {
    const $store = coreDatass.number(99)
    expect($store.use).toBeUndefined()
  })

  it('upgrades a core store in place and returns the same reference', () => {
    const $store = coreDatass.number(1)
    const upgradedStore = reactDatass.upgrade($store)
    expect(upgradedStore).toBe($store)
    expect(typeof upgradedStore.use).toBe('function')
  })

  it('provides hooks from upgraded stores created in core', () => {
    const $store = coreDatass.number(10)
    reactDatass.upgrade($store)

    const { getByTestId } = render(<StateObserver store={$store} />)
    expect(getByTestId('value').textContent).toBe('10')

    act(() => {
      $store.set(20)
    })
    expect(getByTestId('value').textContent).toBe('20')
  })

  it('is idempotent when upgrade is called multiple times', () => {
    const $store = coreDatass.boolean(false)
    const upgradedOnce = reactDatass.upgrade($store)
    const upgradedTwice = reactDatass.upgrade($store)
    expect(upgradedOnce).toBe(upgradedTwice)
  })
})
