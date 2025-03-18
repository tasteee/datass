// goddammitcopilot just tellme how I make an image in markdowm
![DATASS](/logo.svg)

## data super store [WIP]

its lightweight, flexible, and unopinionated. if ur feeling like switching it up, u should give datass a shot.

### Jokes aside...

datass is a state management library for React that focuses on developer experience. It is simple
as fuck, it is flexible, and it is super lightweight.

## Install

Choose your poison.

```bash
npm i datass
```

```bash
yarn add datass
```

```bash
bun install datass
```

## Import

```ts
import { datass } from 'datass'
```

## Usage

```ts
const name = datass.string('lilith')
const age = datass.number(25)
const isFun = datass.boolean(true)
const favoriteColors = datass.array<string>(['green', 'yellow'])
const friend = datass.object({ name: 'hannah', isBest: false })

const MyComponent0 = () => {
    name.use()
    return <p>Name: {name.state}</p>
}

const MyComponent1 = () => {
    age.use()
    return <p>Age: {age.state}</p>
}

const MyComponent2 = () => {
    const isSheFun = isFun.use()
    const text = isShefun ? 'yup' : 'meh'
    return <p>She fun? {text}</p>
}

const MyComponent3 = () => {
    const gColors = favoriteColors.useFilter(color => color.startsWith('g'))
    return <p>G Colors: {gColors.map(color => <span>{color}</span>)</p>
}

```

## OLD DOCS -- THIS SHI IS A WORK IN PROGRESS.

Selectors are cached and even when a store's state changes a datass store hook will only cause
a component to re-render if the result of the selector is different from the previous result.

Consider this:

```ts
// We create a store with an array of numbers.
const $numbers = datass.array([1, 2, 3, 4, 5])

// We hook into the store inside of a component using
// a hook/selector that filters out any odd numbers.
// The result here is [2, 4].
const evenNumbers = $numbers.useFilter((number) => number % 2 === 0)

// We then update the store with a new set of numbers, but
// we leave out any odd numbers.
$numbers.set([2, 4])
```

In the case above, the hook into $numbers will not cause a re-render
because the resulting length and values of the array produced by the selector
applied to [2, 4] is the same resulting length and values of the array produced by the
selector applied to [1, 2, 3, 4, 5].

### TODO: Thorough documentation.

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
