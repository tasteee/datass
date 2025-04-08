![DATASS](/logo.svg)

## data super store

```tsx
import { datass } from 'datass'

// datass.string stores

const $userName = datass.string('')
$userName.set('tasteink')
$userName.set.reset()
$userName.use()
console.log($userName.state)

// datass.number stores

const $clickCount = datass.number(0)
$clickCount.set($clickCount.state + 1)
$clickCount.set.reset()
$clickCount.use()
console.log($clickCount.state)

// datass.boolean stores

const $isDarkMode = datass.boolean(true)
$isDarkMode.set(!$isDarkMode.state)
$isDarkMode.set.toggle()
$isDarkMode.set.reset()
$isDarkMode.use()
console.log($isDarkMode.state)

// datass.array stores

const todo0 = { id: 0, label: 'feed a cat', isComplete: true }
const todo1 = { id: 1, label: 'hug a minotaur', isComplete: false }
const todo2 = { id: 2, label: 'fight fascism', isComplete: false }
const todo3 = { id: 123, label: 'has a nap', isComplete: false }
const todo4 = { id: 234, label: 'be kind', isComplete: false }
const todo5 = { id: 345, label: 'speak up', isComplete: false }

type TodoT = { id: number; label: string; isComplete: boolean }
const $todos = datass.array<TodoT>([todo0, todo1, todo2])

$todos.set.append(todo3)
$todos.set.prepend(todo4)
$todos.set([todo3, todo5])

$todos.use()
$todos.use((list) => list.isComplete)
$todos.use.find((todo) => todo.id === 2)
console.log($todos.state)

// datass.object stores

type UserStoreT = {
  name: { first: string; last: string }
  age: number
  sex: boolean
  id: number
}

const $user = datass.object<UserStoreT>({
  name: {
    first: 'Hannah',
    last: 'Colcleasure'
  },

  age: 420,
  sex: true,
  id: 12345
})

$user.set({ age: 421 })
$user.use()
$user.use((state) => state.age)
$user.set.reset()
console.log($user.state)

// Middleware can be used to modify the final store in any way.
const customMiddlewareDatass = datass.withMiddleware(middlewareFunc0, middlewareFunc1)
const $someState = customMiddlewareDatass.object<StoreT>({ foo: 'bar' })

// And specific middleware configurations can be reused...
const $otherState = customMiddlewareDatass.string('yolo')
```
