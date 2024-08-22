// goddammitcopilot just tellme how I make an image in markdowm
![DATASS](/logo.svg)

## data super store [WIP]

datass helps you finish quicker.

its lightweight, flexible, and unopinionated. if ur feeling like switching it up, you should give datass a shot.

## datass is easy

(honestly i havent tried it, myself, but i heard datass is easy af. my homie said that anybody could pick up datass with just a few one liners, and he donesn't know _anybody_ that has tried datass and not fallen in love.)

```ts
import { datass } from 'datass'

const canLie = datass(false)
const usersLikes = datass(['big butts', 'honesty'])
const userName = datass('sir mixalot')
```

datass doesn't care if the data you fill it with is real or fake, or even if you has to use some third party data enhancement tools, and it doesnt give a damn about any context -- it isn't intersted in your "features" or whatever.

datass is only interested in **one** thing. it just wants to get the job done.

```ts
const brothersIncapableOfDenying = datass(['richard', 'harambe', 'hank "the tank" mardukas'])

const userStats = datass({
	age: 69,
	height: 6.9,
	weight: 420
})
```

## datass is safe

quit worryyyyying. you dont need protection - datass is a safe alternative to the tradtional tooling.

datass doesn't have a lot of rules and will allow you to do pretty much whatever you want while it adjusts to your needs. datass doesn't throw errors all the time like ur previous flings, and it may even be ok if it is not the only thing you're putting your data in.

datass has a lot of people pleasing tendencies, honestly. it truely doesn't want to throw off the vibe -- but if you do try to stick something in datass without properly preparing it, it might let out get a little mouthy.

```ts
const permittedPenetrationTester = datass<string>('dave')

// other testers to permit
const proposedPenetrationTesters = ['dave', 'rodney', 'greg', 'katherine']

permittedPenetrationTester.set(otherPenetrationTesters)
// datass: "the last we spoke, we agreed it would only be you, dave..."
```

**NOTE:** generally, you should not be trying to coerce datass into accepting different types of things that it is not ready for, and you find other ways to reason about what you decide to put in datass and what you expect to get out of it. always give datass heads up before you just cram something random in there.

## datass doesnt care about size

whether your data is just a wee little string or a gargantuan object, datass is ready to take it on.

```ts
const weeLittleString = datass<string>('weeee')

const gargantuanObject = datass({
	name: 'gargantuan leviathan',
	nickname: 'levi the G',

	description:
		'The gargantuan leviathan possesses a near limitless amount of stamina and the creature is never really shown getting tired or exhausted after swimming for long durations of time.',

	funFact: 'Its top speed is around 80 miles per hour.'
})
```

## use datass

```tsx
import { datass } from 'datass'

type UserT = {
  name: string
  likes: string[]
}

const $newSongLyrics = datass<string>('i like datass and i cannot lie')

const $user = datass({
  name: 'sir mixalot',
  canLie: false,
  likes: ['big butts', 'honesty']
})

const ComponentA = () => {
  const user = $user.use()

  return (
    <div>
      <input value={$user} onChange={$user.set}>
    </div>
  )
}
```

```tsx
const ComponentB = () => {
	// if state is an object, you can access it by key or
	// by a path to access a piece of data within the object.
	const usersFavoriteThing = $user.use('likes[0]')
	const userCanLie = $user.use('canLie')
	// or you can use the mighty selector, in which case
	// state only updates when it no longer evaluates to "sir"
	const userFirstName = $user.use((user) => user.name.split(' ')[0])
	// or you can just get the whole state
	const user = $user.use()
	// or you can not subscribe at all and just access the
	// state's values...
	const userLikes = $user.state.likes
	const userCanLie = $user.state.canLie

	// or maybe youre not trying to access data, you're trying
	// to update it. silly me, here your sign:
	$user.set({
		name: 'sir liesalot',
		canLie: true,
		likes: ['big butts', 'honesty', 'lying']
	})

	$someStringState.set('datass is the best')
	$someStringState.set(event) // will auto handle event.target.value
	$whateverState.set((state) => state + 1)
	$someObjectState.set((state) => ({ newKey: 'newValue' }))
	$someArrayState.set((state) => [...state, 'newItem'])
	$someState.reset()
}
```

## datass will answer the call

day or night, if you've got data and you need something to react to it in a way that gives you confidence that you know what the fuck youre doing -- datass is the one for you.
