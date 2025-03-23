![DATASS](/logo.svg)

## data super store

datass is a state management library for React that focuses on developer experience. It is lightweight, flexible, and unopinionated. If you're feeling like switching it up, maybe give datass a shot.

# It is soooo easy.

```tsx
import { datass } from 'datass'

const nameStore = datass.string('Hannah')
const ageStore = datass.number(25)
const isActiveStore = datass.boolean(true)
const favoriteFoodsStore = datass.array(['catfood', 'spam'])
const avatarUrlStore = datass.string('imgur.com/foobarbaz.png')

// Trigger state updates from anywhere in your app,
// even from outside of React components.
ageStore.set(26)
isActiveStore.set.toggle()
favoriteFoodsStore.set.append('milk')

// Read store states from anywhere in your app, as well.
ageStore.state // 26
isActiveStore.state // false
favoriteFoodsStore.state // ['catfood', 'spam', 'milk']

// Subscribing to state updates from within a React component
// is the easiest thing you've ever done.
const UserAvatar = () => {
  avatarUrlStore.use()
  return <img src={avatarUrlStore.state} />
}

const UserSettingsMenu = () => {
  const avatarUrl = avatarUrlStore.use()
  const handleChange = avatarUrlStore.set.fromEvent
  // store.set.fromEvent(event) will automatically issue a state
  // update based on the event.target.value.

  return (
    <div>
      <input onChange={handleChange} value={avatarUrl} />
      {/* ... other user settings stuffs */}
    </div>
  )
}
```

## Install

```bash
npm i datass
```

## Import

```ts
import { datass } from 'datass'
```

## Table of Contents

1. [Basic Concepts](#basic-concepts)
2. [Store Types](#store-types)
   - [String Store](#string-store)
   - [Number Store](#number-store)
   - [Boolean Store](#boolean-store)
   - [Array Store](#array-store)
   - [Object Store](#object-store)
3. [React Integration](#react-integration)
4. [Advanced Usage](#advanced-usage)
5. [Best Practices](#best-practices)
6. [TypeScript Support](#typescript-support)

## Basic Concepts

### Creating Stores

The `datass` library provides specialized store creators for different data types:

```javascript
import { datass } from 'datass'

// Create different types of stores
const textStore = datass.string('Initial text')
const counterStore = datass.number(0)
const toggleStore = datass.boolean(false)
const listStore = datass.array([1, 2, 3])
const userStore = datass.object({ name: 'John', age: 30 })
```

### Store Interface

All stores share these common properties and methods:

- `store.state` - Access the current state
- `store.set(newState)` - Replace the state
- `store.set.reset()` - Reset to initial state
- `store.set.fromEvent(event)` - Update state from an event object
- `store.use()` - React hook to use the state in components
- `store.identify(name)` - Name a store for debugging

## Store Types

### String Store

Specialized for string values.

```javascript
import { datass } from 'datass'

// Create a string store
const nameStore = datass.string('John')

// Get the current value
console.log(nameStore.state) // "John"

// Update the value
nameStore.set('Alice')

// Update from an input event
function handleChange(event) {
  nameStore.set.fromEvent(event)
}

// Reset to initial value
nameStore.set.reset() // back to "John"
```

### Number Store

Specialized for number values with arithmetic operations.

```javascript
import { datass } from 'datass'

// Create a number store
const counterStore = datass.number(0)

// Basic state operations
console.log(counterStore.state) // 0
counterStore.set(5)
console.log(counterStore.state) // 5

// Convenience methods
counterStore.set.add(3) // 8
counterStore.set.subtract(2) // 6

// Reset to initial value
counterStore.set.reset() // back to 0
```

### Boolean Store

Specialized for boolean values with toggle functionality.

```javascript
import { datass } from 'datass'

// Create a boolean store
const darkModeStore = datass.boolean(false)

// Basic state operations
console.log(darkModeStore.state) // false
darkModeStore.set(true)
console.log(darkModeStore.state) // true

// Toggle the value
darkModeStore.set.toggle() // false
darkModeStore.set.toggle() // true

// Reset to initial value
darkModeStore.set.reset()
```

### Array Store

Specialized for array values with collection operations.

```javascript
import { datass } from 'datass'

// Create an array store
const todosStore = datass.array([
  { id: 1, text: 'Learn datass', completed: false },
  { id: 2, text: 'Build an app', completed: false }
])

// Basic state operations
console.log(todosStore.state) // [{ id: 1, ... }, { id: 2, ... }]

// Replace the entire array
todosStore.set([{ id: 3, text: 'New task', completed: false }])

// Add items to the array
todosStore.set.append({ id: 4, text: 'Fourth task', completed: false })
// Results in [{ id: 3, ... }, { id: 4, ... }]

todosStore.set.prepend({ id: 0, text: 'First task', completed: false })
// Results in [{ id: 0, ... }, { id: 3, ... }, { id: 4, ... }]

// Produce the next state by filtering the current state.
todosStore.set.filter((todo) => !todo.completed)
// Keeps only uncompleted todos

// Produce the next state by deriving it from the current state.
todosStore.set.map((todo) => ({
  ...todo,
  text: todo.text.toUpperCase()
}))

// Produce the next state by concatenating new items onto the current state.
todosStore.set.merge([{ id: 5, text: 'Another task', completed: false }])

// Reset to initial value
todosStore.set.reset()
```

### Object Store

Specialized for object values with deep access and updates.

```javascript
import { datass } from 'datass'

// Create an object store
const userStore = datass.object({
  profile: {
    name: 'John',
    email: 'john@example.com'
  },
  preferences: {
    darkMode: false,
    notifications: {
      email: true,
      push: false
    }
  }
})

console.log(userStore.state)

// Produce the next state by completely overwriting the current state.
userStore.set({
  profile: {
    name: 'Alice',
    email: 'alice@example.com'
  },
  preferences: {
    darkMode: true,
    notifications: {
      email: false,
      push: true
    }
  }
})

// Produce the next state by providing a patch to be applied to the current state. Specified object values will be replaced, but existing values that are not targeted by the merging object will be left in place, rather than being erased, as is the case with `set`.
userStore.set.merge({
  preferences: {
    language: 'en'
  }
})

// Produce the next state by laser targeting a specific value change in the current state.
userStore.set.deep('preferences.notifications.push', true)
userStore.set.deep('profile.name', 'Bob')

// Reset to initial value
userStore.set.reset()
```

## React Integration

### Basic Usage with Hooks

```jsx
import React from 'react'
import { datass } from 'datass'

// Create stores outside of component
const counterStore = datass.number(0)
const nameStore = datass.string('Guest')

function MyComponent() {
  // Subscribe to changes to both stores.
  counterStore.use()
  nameStore.use()

  const increment = () => counterStore.set.add(1)

  return (
    <div>
      <h1>Hello, {nameStore.state}!</h1>
      <p>Counter: {counterStore.state}</p>
      <button onClick={increment}>Increment</button>
      <input value={nameStore.state} onChange={nameStore.set.fromEvent} />
    </div>
  )
}
```

### Selectors

You can use selectors to access specific parts of your state, only causing
your component to rerender when a state update causes your selector to return
a different value than it produced with the last state value.

```jsx
import React from 'react'
import { datass } from 'datass'

const userStore = datass.object({
  name: 'Alice',
  age: 30,
  address: {
    city: 'New York',
    country: 'USA'
  }
})

function UserProfile() {
  // Rerender with updated name / age when either
  // of the values change in userStore, but not,
  // for example, when userStore.state.address changes.
  const name = userStore.use((state) => state.name)
  const age = userStore.use((state) => state.age)

  return (
    <div>
      <h2>
        {name}, {age}
      </h2>
    </div>
  )
}

function UserLocation() {
  // Only re-render when userStore.state.address changes.
  const address = userStore.use((state) => state.address)
  // Doing userStore.set.merge({ age: 20 }), for example, would
  // not result in this component rerendering.

  return (
    <div>
      <p>
        Location: {address.city}, {address.country}
      </p>
    </div>
  )
}
```

### Array Store Hooks

Array stores provide specialized hooks for derived state:

```jsx
import React from 'react'
import { datass } from 'datass'

const todosStore = datass.array([
  { id: 1, text: 'Learn datass', completed: false },
  { id: 2, text: 'Build an app', completed: true },
  { id: 3, text: 'Share with friends', completed: false }
])

function TodoApp() {
  // Get all todos
  const allTodos = todosStore.use()

  // Get only completed todos with .use.filter
  const completedTodos = todosStore.use.filter((todo) => todo.completed)

  // Transform todos with .use.map
  const todoTexts = todosStore.use.map((todo) => todo.text)

  return (
    <div>
      <h2>All Todos ({allTodos.length})</h2>
      <ul>
        {allTodos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>

      <h2>Completed Todos ({completedTodos.length})</h2>
      <ul>
        {completedTodos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>

      <h2>Todo Texts</h2>
      <ul>
        {todoTexts.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Object Store Deep Access

Object stores provide a deep access hook:

```jsx
import React from 'react'
import { datass } from 'datass'

const settingsStore = datass.object({
  user: {
    profile: {
      name: 'John',
      theme: {
        color: 'blue',
        fontSize: 'medium'
      }
    }
  },
  app: {
    version: '1.0.0',
    features: {
      newEditor: true
    }
  }
})

function ThemeSelector() {
  // Only subscribe to the theme color
  const themeColor = settingsStore.use.deep('user.profile.theme.color')

  return (
    <div>
      <p>Current theme: {themeColor}</p>
      <button onClick={() => settingsStore.set.deep('user.profile.theme.color', 'red')}>Change to Red</button>
    </div>
  )
}

function AppVersionDisplay() {
  // Only subscribe to the app version
  const version = settingsStore.use.deep('app.version')

  return <p>App Version: {version}</p>
}
```

## Advanced Usage

### Form Handling

```jsx
import React from 'react'
import { datass } from 'datass'

// Create a form state store
const formStore = datass.object({
  username: '',
  email: '',
  password: '',
  terms: false
})

function SignupForm() {
  // Subscribe to the whole form state
  const formState = formStore.use()

  function handleSubmit(event) {
    event.preventDefault()
    console.log('Form submitted:', formState)
    // Call API, etc.
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Username:
          <input
            type="text"
            value={formState.username}
            onChange={(event) => formStore.set.deep('username', event.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Email:
          <input
            type="email"
            value={formState.email}
            onChange={(event) => formStore.set.deep('email', event.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Password:
          <input
            type="password"
            value={formState.password}
            onChange={(event) => formStore.set.deep('password', event.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={formState.terms}
            onChange={(event) => formStore.set.deep('terms', event.target.checked)}
          />
          I agree to the terms
        </label>
      </div>

      <button type="submit">Sign Up</button>
    </form>
  )
}
```

### Todo List Example

```jsx
import React from 'react'
import { datass } from 'datass'

const todosStore = datass.array([])
const newTodoStore = datass.string('')
const filterStore = datass.string('all')
// possible filters: 'all', 'active', 'completed'

const TodoApp = () => {
  // Rerender when any of the stores change.
  todosStore.use()
  newTodoStore.use()
  filterStore.use()

  const activeTodos = todosStore.state.filter((todo) => !todo.completed)
  const completedTodos = todosStore.state.filter((todo) => todo.completed)
  const areSomeTodosComplete = completedTodos.length > 0

  // Only todos that match the currently active filter.
  const filteredTodos = todosStore.state.filter((todo) => {
    if (filterStore.state === 'active') return !todo.completed
    if (filterStore.state === 'completed') return todo.completed
    return true // 'all' filter
  })

  // Add a new todo item to todosStore based on newTodoStore's
  // state and clear newTodoStore's state.
  const handleAddTodo = (event) => {
    event.preventDefault()

    const trimmedTodoText = newTodoStore.state.trim()
    if (!trimmedTodoText) return

    const newTodoItem = {
      id: Date.now(),
      completed: false,
      text: trimmedTodoText
    }

    todosStore.set.append(newTodoItem)
    newTodoStore.set.reset()
  }

  // Update todosStore state by toggling the completed status of the todo with the provided id.
  const toggleTodoComplete = (id) => {
    const toggleCompleted = (todo) => ({ ...todo, completed: !todo.completed })
    todosStore.set.map((todo) => (todo.id === id ? toggleCompleted(todo) : todo))
  }

  // Update todosStore state by filtering out the todo with the provided id.
  const deleteTodo = (id) => {
    const checkDoesTodoMatchId = (todo) => todo.id !== id
    todosStore.set.filter(checkDoesTodoMatchId)
  }

  // Update todosStore state with all completed todos filtered out.
  const clearCompletedTodos = () => {
    todosStore.set.filter((todo) => !todo.completed)
  }

  const setAllFilter = () => filterStore.set('all')
  const setActiveFilter = () => filterStore.set('active')
  const setCompletedFilter = () => filterStore.set('completed')

  return (
    <div>
      <h1>Todos</h1>

      <form onSubmit={handleAddTodo}>
        <input
          type="text"
          value={newTodoStore.state}
          onChange={newTodoStore.set.fromEvent}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <div>
        <button onClick={setAllFilter}>All ({todosStore.state.length})</button>
        <button onClick={setActiveFilter}>Active ({activeTodos.length})</button>
        <button onClick={setCompletedFilter}>Completed ({completedTodos.length})</button>
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <Todo
            key={todo.id}
            {...todo}
            onToggle={() => toggleTodoComplete(todo.id)}
            deleteTodo={() => deleteTodo(todo.id)}
          />
        ))}
      </ul>

      {areSomeTodosComplete && <button onClick={clearCompletedTodos}>Clear completed</button>}
    </div>
  )
}

const Todo = (props) => {
  const textDecoration = props.completed ? 'line-through' : 'none'
  const style = { textDecoration }

  return (
    <li>
      <input type="checkbox" checked={props.completed} onChange={props.onToggle} />
      <span style={style}>{props.text}</span>
      <button onClick={props.deleteTodo}>Delete</button>
    </li>
  )
}
```

## Best Practices

### Store Organization

Keep related state in a single store:

```javascript
// Good: Related data in one store
const userStore = datass.object({
  name: 'John',
  email: 'john@example.com',
  preferences: {
    darkMode: false,
    language: 'en'
  }
})

// Avoid: Splitting related data across multiple stores
const userNameStore = datass.string('John')
const userEmailStore = datass.string('john@example.com')
const darkModeStore = datass.boolean(false)
const languageStore = datass.string('en')
```

### Store Placement

datass stores cannot be instantiated inside of React components or hooks. They must be created outside of React's tree because they are all singletons; ideal for shared or global state stores.

```javascript
// Good: Created outside component
import { datass } from 'datass'

const counterStore = datass.number(0)

function Counter() {
  const count = counterStore.use()
  // ...
}

// Avoid: Creating stores inside components
function BadCounter() {
  // Creates a new store on every render
  const counterStore = datass.number(0)
  const count = counterStore.use()
  // ...
}
```

## TypeScript Support

`datass` is built with TypeScript and provides full type safety:

```typescript
import { datass } from 'datass'

// String store with type inference
const nameStore = datass.string('John')
// nameStore.state is typed as string

// Number store with type inference
const countStore = datass.number(0)
// countStore.state is typed as number

// Typed array store
interface Todo {
  id: number
  text: string
  completed: boolean
}

const todosStore = datass.array<Todo>([{ id: 1, text: 'Learn TypeScript', completed: false }])
// todosStore.state is typed as Todo[]

// Typed object store
interface UserState {
  name: string
  age: number
  address: {
    city: string
    country: string
  }
}

const userStore = datass.object<UserState>({
  name: 'John',
  age: 30,
  address: {
    city: 'New York',
    country: 'USA'
  }
})
// userStore.state is typed as UserState

// Type-safe selectors
const userName = userStore.use((state) => state.name)
// userName is typed as string

const userCity = userStore.use.deep('address.city')
// userCity is typed as string
```
