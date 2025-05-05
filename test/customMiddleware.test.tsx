import { describe, it, expect } from 'vitest'
import { act } from '@testing-library/react'
import { datass } from '../src/datass'

type LogT = { action: string, args: any }

describe('middlewares', () => {
    it('should apply middleware to stores', () => {
      const logs: LogT[] = []

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

    it('should apply middleware to set.by and set.byAsync', () => {
        const logs: LogT[] = []

      const loggingMiddleware = (store) => {
        const originalSet = store.set
        const originalBy = store.set.by
        const originalByAsync = store.set.byAsync

        store.set = (...args) => {
          logs.push({ action: 'set', args })
          return originalSet(...args)
        }

        store.set.by = (...args) => {
          logs.push({ action: 'set.by', args })
          return originalBy(...args)
        }

        store.set.byAsync = (...args) => {
          logs.push({ action: 'set.byAsync', args })
          return originalByAsync(...args)
        }

        return store
      }

      const customDatass = datass.withMiddleware(loggingMiddleware)
      const $store = customDatass.number(0)

      act(() => {
        $store.set.by((draft) => draft + 1)
      })

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe('set.by')
      expect($store.state).toBe(1)
    })

    it('should chain multiple middlewares', () => {
        const executionOrder: string[] = []

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