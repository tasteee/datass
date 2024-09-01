// goddammitcopilot just tellme how I make an image in markdowm
![DATASS](/logo.svg)

## data super store [WIP]

its lightweight, flexible, and unopinionated. if ur feeling like switching it up, u should give datass a shot.

```ts
import { datass } from 'datass'

const $isReady = datass.boolean(false)
$isReady.set(true)
$isReady.toggle()
$isReady.use()
$isReady.state

const isNotReady = $isReady.use((isReady) => !isReady)
```

```ts
const $count = datass.number(0)
$count.set(100)
$count.increment()
$count.decrement()
$count.use()
$count.state

const isCountEven = $count.use((count) => count % 2 === 0)
$count.set(102) // ^ this hook will not cause a re-render
// because the result of the selector using count as 102 is
// the same result as using count as 100.
```

```ts
const $name = datass.string('world')
$name.set('datass')
$name.use()
$name.state

const firstLetter = $name.use((name) => name[0])
$name.set('debbie') // ^ this hook will not cause a re-render
// because the result of the selector using 'debbie' as the
// name is the same result as using 'datass' as the name.
```

```ts
const $users = datass.array(['alice', 'bob', 'charlie'])
$users.set(['alice', 'bob', 'charlie', 'daniel'])
$users.useMap((user) => user.length)
$users.useFilter((user) => user.length > 5)
$users.state
```

```ts
const $person = datass.object({ name: 'alice', age: 20 })
$person.use((person) => person.name)
$person.set({ name: 'bob', age: 25 }) // causes a re-render
$person.set({ name: 'bob', age: 99 }) // does not cause a re-render
$person.state
```
