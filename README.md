![DATASS](/logo.svg)

## data super store

### datass is super easy to use. you should try it.

datass is a _shared_ state managment library for React. It is _super_ simple, intuitive, flexible, and robust.

```ts
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

// All stores have these additional setter methods.
const $store = datass.object({ name: 'Brooklyn', age: 123 })

$store.set.by((draft) => {
  draft.name = draft.name.toUpperCase()
  draft.age += 10
})

$store.set.byAsync(async (draft) => {
  const whatever = await something()
  draft.name = whatever.value
})

// IMPORTANT: An object store's set method will
// merge the provided object into the existing state
// object to derive the new state object. Any other
// store type's set method will replace the existing
// state with the provided value.

const $objectStore = datass.object({ foo: true, bar: true })
$objectStore.set({ foo: false })
$objectStore.state // { foo: false, bar: true }
$objectStore.set({ bar: false })
$objectStore.state // { foo: false, bar: false }

const $arrayStore = datass.array([1, 2, 3])
$arrayStore.set([0, 1, 2])
$arrayStore.state // [0, 1, 2]

// Array stores provide specific setter methods
// to help manage the state.
$arrayStore.set.append(3)
$arrayStore.state // [0, 1, 2, 3]
$arrayStore.set.prepend(-1)
$arrayStore.state // [-1, 0, 1, 2, 3]
$arrayStore.add(4, 5, 6)
$arrayStore.state // [-1, 0, 1, 2, 3, 4, 5, 6]
```
