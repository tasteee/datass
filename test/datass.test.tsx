import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { datass } from '../src/index'
import { useEffect, useState } from 'react'
import * as React from 'react'

// Helper to test React state updates
const renderWithHook = (hook: () => any) => {
 let result: any
 const TestComponent = () => {
  result = hook()
  return null
 }
 render(<TestComponent />)
 return result
}

describe('datass state management', () => {
 it('should have correct string initial state', () => {
  const store = datass.string('foo')
  expect(store.state).toBe('foo')
 })

 // it should have correct number initial state

 // it should have correct boolean initial state

 // it should have correct array initial state

 // it should have correct object initial state

 it('should update string store state', () => {
  const store = datass.string('')
  expect(store.state).toBe('')
  store.set('hello')
  expect(store.state).toBe('hello')
 })

 // it should update number store state

 // it should update boolean store state

 // it should update array store state

 // it should update object store state

 it('should trigger re-render when using store.use()', () => {
  const store = datass.string('initial')
  let value = renderWithHook(() => store.use())
  expect(value).toBe('initial')

  act(() => {
   store.set('updated')
  })

  value = renderWithHook(() => store.use())
  expect(value).toBe('updated')
 })

 it('should toggle boolean store', () => {
  const store = datass.boolean(false)
  expect(store.state).toBe(false)
  store.setToggle()
  expect(store.state).toBe(true)
  store.setToggle(false)
  expect(store.state).toBe(false)
 })

 it('should increment and decrement number store', () => {
  const store = datass.number(0)
  expect(store.state).toBe(0)
  store.setIncrement()
  expect(store.state).toBe(1)
  store.setDecrement()
  expect(store.state).toBe(0)
 })

 it('should append and prepend items to array store', () => {
  const store = datass.array<number>([])
  expect(store.state).toEqual([])
  store.append(1)
  expect(store.state).toEqual([1])
  store.prepend(0)
  expect(store.state).toEqual([0, 1])
 })

 it('should filter and map array store', () => {
  const store = datass.array<number>([1, 2, 3, 4])

  const filtered = renderWithHook(() => store.useFilter((num) => num > 2))
  const mapped = renderWithHook(() => store.useMap((num) => num * 2))

  expect(filtered).toEqual([3, 4])
  expect(mapped).toEqual([2, 4, 6, 8])
 })

 it('should merge object store state', () => {
  const store = datass.object({ a: 1, b: 2 })
  expect(store.state).toEqual({ a: 1, b: 2 })
  store.merge({ b: 3, c: 4 })
  expect(store.state).toEqual({ a: 1, b: 3, c: 4 })
 })

 it('should allow partial object selection with usePartial', () => {
  const store = datass.object({ nested: { value: 42 } })
  const partial = renderWithHook(() => store.usePartial('nested.value'))
  expect(partial).toBe(42)
 })
})
