![DATASS](/logo.svg)

data-superstore (datass) 🦇 Local and global stores. DX focused API. TypeScript first. Simple as hell. Capable as fuck.

```
npm add datass
```

## Two entry points

| Import         | What you get                                       |
| -------------- | -------------------------------------------------- |
| `datass`       | Framework-agnostic core — no React dependency      |
| `datass/react` | React adapter — adds `.use()` hooks to every store |

---

## Framework-agnostic API (`datass`)

```ts
import { datass } from 'datass'
```

Create stores outside any component and read/write state anywhere — no framework required.

### `number`

```ts
const $num = datass.number(100)

$num.state // 100
$num.set(200) // → 200
$num.set.add(50) // → 250
$num.set.subtract(25) // → 225
$num.set.reset() // → 100

// Immer draft updater
$num.set.by((draft) => draft * 2) // → 200

// Async updater — returns true on success, false on error
await $num.set.byAsync(async (current) => current + 1)

// Bind directly to an <input> change event
inputEl.addEventListener('change', $num.set.fromEventTarget)
```

### `string`

```ts
const $str = datass.string('foo')

$str.state // 'foo'
$str.set('bar') // → 'bar'
$str.set.reset() // → 'foo'
$str.set.by((s) => s.toUpperCase())

// Optionally narrow to a union type
const $mode = datass.string<'light' | 'dark'>('light')
$mode.set('dark')

inputEl.addEventListener('change', $str.set.fromEventTarget)
```

### `boolean`

```ts
const $bool = datass.boolean(true)

$bool.state // true
$bool.set(false) // → false
$bool.set.toggle() // → true
$bool.set.reset() // → true
$bool.set.by((v) => !v)
```

### `array`

```ts
const $arr = datass.array<number>([0, 1, 2])

$arr.state // [0, 1, 2]
$arr.set([10, 11, 12]) // replace entire array
$arr.set.append(13) // → [10, 11, 12, 13]
$arr.set.prepend(9) // → [9, 10, 11, 12, 13]
$arr.set.append(14, 15) // append / prepend accept multiple items
$arr.set.reset() // → [0, 1, 2]

// Set a nested value by dot-path
$arr.set.lookup('0', 99) // state[0] = 99
$arr.set.lookup('0.name', 'x') // state[0].name = 'x'
```

### `object`

Object stores **merge** partial updates into existing state by default.  
Use `set.replace` to fully overwrite.

```ts
type UserT = { name: string; age?: number; scores?: number[] }
const $obj = datass.object<UserT>({ name: 'tasteink' })

$obj.state // { name: 'tasteink' }
$obj.set({ age: 30 }) // → { name: 'tasteink', age: 30 }
$obj.set.replace({ name: 'rokki' }) // → { name: 'rokki' } (full replace)
$obj.set.reset() // → { name: 'tasteink' }

// Set a nested value by dot-path
$obj.set.lookup('name', 'tasteink')
$obj.set.lookup('scores.0', 100)

// Immer draft updater
$obj.set.by((draft) => {
  draft.name = draft.name.toUpperCase()
  draft.age = (draft.age ?? 0) + 1
})
```

### `set.by` — Immer draft updater (all store types)

```ts
const $user = datass.object({ name: 'Brooklyn', age: 30, skills: ['JavaScript'] })

$user.set.by((draft) => {
  draft.name = draft.name.toUpperCase()
  draft.age += 1
  draft.skills.push('datass')
})
```

### `set.byAsync` — Async updater (all store types)

Return new state directly **or** return a draft function for Immer-style mutations.  
Returns `true` on success, `false` if the async function throws.

```ts
const $users = datass.array([])

await $users.set.byAsync(async (current) => {
  const data = await fetch('/api/users').then((r) => r.json())
  return data // directly return new state
})

// …or return a draft function:
await $users.set.byAsync(async () => (draft) => {
  draft.push({ id: 99, name: 'new user' })
})
```

### `watch` — React-free subscriptions

```ts
// Simple reaction — called on every state change
const unsubscribe = $obj.watch((oldValue, newValue) => {
  console.log('changed', oldValue, newValue)
})

// Selector-based reaction — only fires when the selected slice changes
const unsubscribe = $obj.watch({
  selector: (state) => state.name,
  reaction: (oldName, newName) => console.log(oldName, '->', newName)
})

unsubscribe() // stop watching
```

---

## React API (`datass/react`)

```ts
import { datass } from 'datass/react'
```

Every store created through the React entry point has all the same setters as the core API, **plus** a `.use()` hook for subscribing React components.

### `.use()` — subscribe a component to store state

```tsx
const $count = datass.number(0)

function Counter() {
  const count = $count.use() // full state
  const doubled = $count.use((n) => n * 2) // with selector
  // ...
}
```

### Number / String / Boolean — with `.use()`

```ts
const $num = datass.number(100)
$num.use() // 100
$num.use((state) => state * 10) // 1000

const $str = datass.string('foo')
$str.use() // 'foo'
$str.use((state) => state.toUpperCase()) // 'FOO'

const $bool = datass.boolean(true)
$bool.use() // true
$bool.use((state) => typeof state) // 'boolean'
```

### Array — with `.use()`, `.use.find()`, `.use.filter()`, `.use.map()`

```ts
const $arr = datass.array<number>([0, 1, 2])

$arr.use() // [0, 1, 2]
$arr.use((state) => state[0]) // 0
$arr.use.find((n) => n > 1) // 2
$arr.use.filter((n) => n > 0) // [1, 2]
$arr.use.map((n) => n * 2) // [0, 2, 4]
$arr.use.lookup('0') // 0
$arr.use.lookup('0', 'fallback') // 0 (or fallback if absent)
```

### Object — with `.use()` and `.use.lookup()`

```ts
type MyObjectT = { name: string; age?: number; scores?: number[] }
const $obj = datass.object<MyObjectT>({ name: 'tasteink', scores: [0, 1, 99] })

$obj.use() // full state object
$obj.use((state) => state.name) // 'tasteink'
$obj.use.lookup('name') // 'tasteink'
$obj.use.lookup('scores.2') // 99
$obj.use.lookup('missing', 'default') // 'default'
```

### `upgrade` — add React hooks to a core store

Mutates the store in-place and returns the same reference. Idempotent.

```ts
import { datass as coreDatass } from 'datass'
import { datass } from 'datass/react'

const $count = coreDatass.number(0) // no .use() yet
datass.upgrade($count) // adds .use() — same store object
$count.use() // ✓
```

---

## Local Stores (React component scope)

`useDatass` creates stores that are scoped to a single component instance.  
The component automatically re-renders when state changes — no `.use()` call needed.

```ts
import { useDatass } from 'datass/react'

function Component() {
  const num = useDatass.number(250)
  const str = useDatass.string('hello')
  const bool = useDatass.boolean(false)
  const arr = useDatass.array([0, 99, 122])
  const obj = useDatass.object({ foo: 'bar' })

  // All the same setters as global stores — just no .use() needed
  const handleClick = () => {
    num.set(120)
    num.set.add(10)
    num.state // 130

    str.set(str.state.toUpperCase())
    str.state // 'HELLO'

    bool.set.toggle()
    bool.state // true

    arr.set.append(222)
    arr.set.prepend(123)
    arr.set.lookup('1', 55)
    arr.state // [123, 55, 99, 122, 222]

    obj.set({ foo: 'baz' })
  }
}
```

---

## Middleware

### Custom Middleware

Middleware is a function `(store) => store`. Wrap setters to intercept any operation.

```ts
import { datass } from 'datass'

const loggingMiddleware = (store) => {
  const originalSet = store.set

  store.set = (...args) => {
    console.log('Setting store state', args)
    return originalSet(...args)
  }

  return store
}

// withMiddleware returns a new independent datass instance — the global one is unaffected
const ss = datass.withMiddleware(loggingMiddleware)
const $settings = ss.object({ theme: 'light', notifications: true })
```

### Built-in: `undoRedo` middleware

```ts
import { datass } from 'datass'

const undoRedo = datass.middleware.undoRedo({ maxHistory: 50 })
const ss = datass.withMiddleware(undoRedo)

const $list = ss.array([0, 5, 10])

$list.set.append(15) // [0, 5, 10, 15]
$list.set.undo() // [0, 5, 10]
$list.set.redo() // [0, 5, 10, 15]

$list.set.canUndo() // true / false
$list.set.canRedo() // true / false
$list.set.getHistorySize() // { past: number, future: number }
$list.set.clearHistory() // wipes both past and future

// Works with all store types and all setter methods (set.by, set.byAsync, toggle, add, …)
```

### Chaining multiple middlewares

```ts
const ss = datass.withMiddleware(loggingMiddleware, undoRedo)
```
