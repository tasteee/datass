import { render } from '@testing-library/react'
import * as React from 'react'

export const renderHook = (hook: () => any) => {
  let result: any
  render(<TestComponent hook={hook} />)
  return result

  function TestComponent({ hook }: { hook: () => any }) {
    result = hook()
    return null
  }
}

export function StateObserver(props: any) {
  const selector = props.selector
  const store = props.store
  const value = selector ? store.use(selector) : store.use()
  return <div data-testid="value">{JSON.stringify(value)}</div>
}
