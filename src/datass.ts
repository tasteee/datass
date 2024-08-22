import { useState, useEffect, useMemo, useCallback } from 'react'

const hq = {
	// When datass(value) is called, a new id is generated
	// and the store for the value is associated with said id.
	associations: new Map()
}

const createAssociation = (store) => {
	hq.associations[store.id] = store
}

const createStateSetter = (store) => {
	const history = [store.state]

	function setState(value) {
		if (Object.is(store.state, value)) return
		history.push(value)
		store.state = value
		store.subscribers.forEach((subscriber) => subscriber(store.state))
	}

	setState.history = history
	return setState
}

type AssStore<T> = {
	state: T
	id: string
	subscribe: (listener) => void
	subscribers: Set<(state: T) => void>
	setState: (value: T) => void
}

const createInitialStore = <T>(initialState: T) => {
	const subscribers = new Set()
	const state = structuredClone<T>(initialState)
	const id = Math.random().toString(36).slice(2)
	const store = { state, subscribers, id } as AssStore<T>
	store.setState = createStateSetter(store)
	store.subscribe = createSubscription(store)
	hq.associations.set(id, store)
	return store
}

const createSubscription = (store) => {
	return (listener) => {
		store.subscribers.add(listener)
		return () => store.subscribers.delete(listener)
	}
}

// type StoreListenerT<T> = (state: T) => void

function createStore<T>(initialState: T) {
	const store = createInitialStore<T>(initialState)
	createAssociation(store)
	return store
}

function _useStore<T, X = T>(store: ReturnType<typeof createStore<T>>, selector?: (value: T) => X) {
	const [state, setState] = useState(() => (selector ? selector(store.state) : store.state))

	const memoizedSelector = useCallback(selector || ((x: T) => x as unknown as X), [selector])

	const memoizedSetState = useCallback(
		(newState: T) => {
			setState((prevState) => {
				const nextState = memoizedSelector(newState)
				return Object.is(prevState, nextState) ? prevState : nextState
			})
		},
		[memoizedSelector]
	)

	useEffect(() => {
		const unsubscribe = store.subscribe(memoizedSetState)
		return unsubscribe
	}, [store, memoizedSetState])

	return useMemo(
		() => ({
			get state() {
				return state
			}
		}),
		[state]
	)
}

export function datass<T>(initialState: T) {
	const store = createStore(initialState)

	return {
		__datassIs: store.id,
		set: (value: T) => store.setState(value),
		use: (selector?: <X>(value: T) => X) => _useStore(store, selector),

		get state() {
			return store.state
		}
	}
}
