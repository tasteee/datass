![DATASS](/logo.svg)

🦇 React stores. Local and global. DX foxused API. TypeScript first. Simple as hell. Capable as fuck.

Install datass.

```
npm add datass
yarn add datass
pnpm add datass
bun add datass
```

Import datass.

```tsx
import { datass, useDatass } from 'datass'

// public store.
const $me = datass.object({ name: 'tasteink' })

const MyComponent = () => {
  // private store.
  const keystrokes = useDatass.number(0)
  const name = $me.use.lookup('name')

  const onChange = (event) => {
    keystrokes.set.add(1)
    $me.set.lookup('name', event.target.value)
  }

  return (
    <>
      <input value={name}>
      <p>name: {name}</p>
      <p>keystrokes: {keystrokes.state}</p>
    </>
  )
}
```

Create and use a datass.number store.

```ts
const $num = datass.number(100)

$num.set(200)
$num.state // 200
$num.set.add(50)
$num.state // 250
$num.set.subtract(25)
$num.state // 225
$num.set.reset()
$num.state // 100
$num.use() // 100
$num.use((state) => state * 10) // 1000

// Inside of a component you can create a piece
// of local datass state:
```

Create and use a datass.string store.

```ts
const $str = datass.string('foo')

$str.set('bar')
$str.state // 'bar'
$str.set.reset()
$str.state // 'foo'
$str.use() // 'foo'
$str.use((state) => state.toUpperCase()) // 'FOO'
```

Create and use a datass.boolean store.

```ts
const $bool = datass.boolean(true)

$bool.set(false)
$bool.state // false
$bool.toggle()
$bool.state // true
$bool.set.reset()
$bool.state // true
$bool.use() // true
$bool.use((state) => typeof value) // 'boolean'
```

Create and use datass.array store.

```ts
const $arr = datass.array<number>([0, 1, 2])

$arr.set([10, 11, 12])
$arr.state // [10, 11, 12]
$arr.set.append(13)
$arr.state // [10, 11, 12, 13]
$arr.set.prepend(9)
$arr.state // [9, 10, 11, 12, 13]
$arr.set.append(1, 2) // append or prepend multiple
$arr.state // [9, 10, 11, 12, 13, 1, 2]
$arr.set.reset()
$arr.state // [0, 1, 2]
$arr.use() // [0, 1, 2]
$arr.use((state) => state.reverse()[0]) // 2
$arr.use.find((value) => value > 1) // 2
$arr.use.filter((value) => value > 0) // [1, 2]
$arr.use.map(arr =>  arr > 0) // [false, true, true]
```

Create and use a datass.object store.

```ts
const $obj = datass.object({ name: 'tasteink' })

// NOTE: For object stores, builds the next state
// by merging the object you provide into the existing
// state object. To fully replace the existing state,
// reach for `yourStore.set.replace({ ... })`

$obj.set({ age: 123 })
$obj.set.reset()
$obj.set.replace({ name: 'rokki', numbers: [0, 1, 2] })
$obj.set.lookup('name', 'tasteink')
$obj.set.lookup('numbers.2', 99)
$obj.use() // { name: 'tasteink', numbers: [0, 1, 99 ]}
$obj.use((state) => state.name) // 'tasteink'
$obj.use.lookup('name') // 'tasteink'
$obj.use.lookup('numbers.2') // 99
```



# 🤍 Hey, real quick...

🙏🤍🖤 I have almost a decade of experience in software, but my career, and subsequently my life, came crashing down when I was laid off in 2023 and fell into the recently-collapsed software job market. I am struggling quite a bit to survive right now.

# [Please pleaseee help if you can.](https://cash.app/$rokkiiii) 🤍🤍🤍


## Immer-powered Updates

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

## Async Updates

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
const ss = datass.withMiddleware(loggingMiddleware)
const $settings = ss.object({ theme: 'light', notifications: true })
```

#### undoRedo middleware

```ts
import { datass } from 'datass'

const undoRedoMiddleware = datass.middleware.undoRedo({ maxHistory: 50 })
const enhancedDatass = datass.withMiddleware(undoRedoMiddleware)
const $myStore = enhancedDatass.array([0, 5, 10])
$myStore.set.append(15)
$myStore.set.undo()
$myStore.set.redo()
```

## TODO

- [ ] Improve documentation on custom middleware.
- [ ] Provide component-level state management hooks
