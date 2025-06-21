![DATASS](/logo.svg)

🦇 React stores. Local and global. DX foxused API. TypeScript first. Simple as hell. Capable as fuck.

```
npm add datass
```

## Let's do it.

### Global Stores

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

const $str = datass.string('foo')

$str.set('bar')
$str.state // 'bar'
$str.set.reset()
$str.state // 'foo'
$str.use() // 'foo'
$str.use((state) => state.toUpperCase()) // 'FOO'

const $bool = datass.boolean(true)

$bool.set(false)
$bool.state // false
$bool.toggle()
$bool.state // true
$bool.set.reset()
$bool.state // true
$bool.use() // true
$bool.use((state) => typeof value) // 'boolean'

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
$arr.use.map((arr) => arr > 0) // [false, true, true]

type MyObjectT = { name: string; age?: number; numbers?: number[] }
const $obj = datass.object<MyObjectT>({ name: 'tasteink' })

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

### Local Stores

```ts
import { useDatass } from 'datass'

const Component = () => {
  const num = useDatass.number(250)
  const str = useDatass.string('hello')
  const bool = useDatass.boolean(false)
  const arr = useDatass.array([0, 99, 122])
  const obj = useDatass.object({ foo: 'bar' })

  // These stores have the exact same APIs
  // except you do not .use() them.
}
```

# 🤍 Hey, real quick...

🙏🤍🖤 I have almost a decade of experience in software, but my career, and subsequently my life, came crashing down when I was laid off in 2023 and fell into the recently-collapsed software job market. I am struggling quite a bit to survive right now.

# [Please pleaseee help if you can.](https://cash.app/$rokkiiii) 🤍🤍🤍

## Immer-powered Object Store Updates

```tsx
const $user = datass.object({
  name: 'Brooklyn',
  age: 30,
  skills: ['JavaScript', 'React']
})

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
