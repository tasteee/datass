![DATASS](/logo.svg)

🦇 Data Super Store ("datass" for short) is a state management library for React that focuses on developer experience. It is simple, flexible, lightweight, and it gives you all the power of sophisticated state management with none of the complexity.

- **Simple API**: Intuitive methods that just work
- **Zero Configuration**: No providers, no complex setup
- **Flexible**: Works with any React app structure
- **Type-Safe**: Built with TypeScript for robust typing
- **Optimized**: Only re-renders when necessary
- **Extensible**: Customizable with middleware
- **Tiny**: Small bundle size with minimal dependencies

## Installation

```
npm install datass
# or
yarn add datass
# or
pnpm add datass
# or
bun install datass
```

## Easy as hell.

```tsx
import { datass } from 'datass'

const $numberStore = datass.number(100)
const $stringStore = datass.string('foo')
const $booleanStore = datass.boolean(false)
const $arrayStore = datass.array([0, 1, 2])
const $objectStore = datass.object({ username: 'tasteink' })

$numberStore.set(200)
$numberStore.state // 200
$numberStore.set.add(50)
$numberStore.state // 250
$numberStore.set.subtract(25)
$numberStore.state // 225
$numberStore.set.reset()
$numberStore.state // 100
$numberStore.use()

$stringStore.set('bar')
$stringStore.state // 'bar'
$stringStore.set.reset()
$stringStore.state // 'foo'
$stringStore.use()

$booleanStore.set(false)
$booleanStore.state // false
$booleanStore.toggle()
$booleanStore.state // true
$booleanStore.set.reset()
$booleanStore.state // true
$booleanStore.use()

$arrayStore.set([10, 11, 12])
$arrayStore.state // [10, 11, 12]
$arrayStore.set.append(13)
$arrayStore.state // [10, 11, 12, 13]
$arrayStore.set.prepend(9)
$arrayStore.state // [9, 10, 11, 12, 13]
$arrayStore.set.reset()
$arrayStore.state // [0, 1, 2]
$arrayStore.use()

$objectStore.set({ age: 123 })
$objectStore.state // { username: 'tasteink', age: 123 }
$objectStore.set.replace({ username: 'rokki' })
$objectStore.state // { username: 'rokki' }
$objectStore.set.reset()
$objectStore.state // { username: 'tasteink' }
$objectStore.use()
```

## Store Types

### String Store

```tsx
const $userName = datass.string('guest')

// Set a new value
$userName.set('tasteink')

// Reset to initial value
$userName.set.reset()

// Get current value
console.log($userName.state) // 'guest'

// Use in components
function UserGreeting() {
  $userName.use()
  return <p>Hello, {$userName.state}</p>
}
```

### Number Store

```tsx
const $clickCount = datass.number(0)

// Increment
$clickCount.set($clickCount.state + 1)

// Add to current value
$clickCount.set.add(5)

// Subtract from current value
$clickCount.set.subtract(2)

// Reset to initial value
$clickCount.set.reset()

// Get current value
console.log($clickCount.state) // 0

// Use in components
function ClickCounter() {
  const count = $clickCount.use()

  return <button onClick={() => $isDarkMode.set.add(1)}>Clicks: {count}</button>
}
```

### Boolean Store

```tsx
const $isDarkMode = datass.boolean(false)

// Set directly
$isDarkMode.set(true)

// Toggle value
$isDarkMode.set.toggle()

// Reset to initial value
$isDarkMode.set.reset()

// Get current value
console.log($isDarkMode.state) // false

// Use in components
function ThemeToggle() {
  const isDark = $isDarkMode.use()

  return <button onClick={$isDarkMode.set.toggle()}>Switch to {isDark ? 'light' : 'dark'} mode</button>
}
```

### Array Store

```tsx
type TodoT = { id: number; label: string; isComplete: boolean }

const initialTodos: TodoT[] = [
  { id: 1, label: 'Learn datass', isComplete: true },
  { id: 2, label: 'Build amazing app', isComplete: false }
]

const $todos = datass.array > TodoT > initialTodos

// Replace entire array
$todos.set([{ id: 3, label: 'New todo', isComplete: false }])

// Add item to end
$todos.set.append({ id: 4, label: 'Another todo', isComplete: false })

// Add item to beginning
$todos.set.prepend({ id: 0, label: 'First todo', isComplete: false })

// Add multiple items to end
$todos.set.append({ id: 5, label: 'Fifth todo', isComplete: false }, { id: 6, label: 'Sixth todo', isComplete: false })

// Get current value
console.log($todos.state) // Array of todos

// Use in components
function TodoList() {
  const todos = $todos.use()

  return todos.map((todo) => <p>{todo.label}</p>)
}
```

## Advanced Features

### Immer-powered Updates

```tsx
const $user = datass.object({
  name: 'Brooklyn',
  age: 30,
  skills: ['JavaScript', 'React']
})

// Update multiple properties with ease using Immer drafts:
$user.set.by((draft) => {
  draft.name = draft.name.toUpperCase()
  draft.age += 1
  draft.skills.push('datass')
})
```

### Async Updates

```tsx
const $users = datass.array([])

// Load users asynchronously:
async function fetchUsers() {
  await $users.set.byAsync(async () => {
    const response = await fetch('https://api.example.com/users')
    const data = await response.json()
    return data // Directly return new state
  })
}
```

### Middleware

#### Custom Middleware

```tsx
// Create a logging middleware:
const loggingMiddleware = (store) => {
  const originalSet = store.set

  store.set = (...args) => {
    console.log(`Setting store state`, args)
    return originalSet(...args)
  }

  return store
}

// Apply middleware:
const customDatass = datass.withMiddleware(loggingMiddleware)
const $settings = customDatass.object({ theme: 'light', notifications: true })
```

#### undoRedo middleware

```ts
import { datass } from 'datass'

const undoRedoMiddleware = datass.middleware.undoRedo({ maxHistory: 50 })
const enhancedDatass = datass.withMiddleware(undoRedoMiddleware)
const $myStore = datass.array([0, 5, 10])
$myStore.set.append(15)
$myStore.set.undo()
$myStore.set.redo()
```

## TODO

- [ ] Provide component-level state management hooks
