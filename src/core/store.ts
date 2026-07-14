import { produce } from 'immer'
import { SubscriberT, WatchReactionT, WatchOptionsT, DrafterT } from './types'

type DraftFnT<StateT> = (draft: StateT) => void | StateT

/**
 * Framework-agnostic state store.
 * Manages state mutations, subscribers, and watchers without React dependencies.
 */
export class DatassStore<StateT> {
  initialState: StateT
  currentState: StateT
  previousState: StateT
  subscribers = new Map<string, SubscriberT<StateT>>()

  watchers: Map<
    string,
    {
      selector?: (state: StateT) => any
      reaction: (oldValue: any, newValue: any) => void
      previousValue?: any
    }
  > = new Map()

  watch = (reactionOrOptions: WatchReactionT<StateT> | WatchOptionsT<StateT, any>) => {
    const id = crypto.randomUUID()

    if (typeof reactionOrOptions === 'function') {
      // Simple watcher with direct reaction
      this.watchers.set(id, {
        reaction: reactionOrOptions,
        previousValue: this.currentState
      })
    } else {
      // Watcher with selector
      const { selector, reaction } = reactionOrOptions
      const selectedValue = selector(this.currentState)

      this.watchers.set(id, {
        selector,
        reaction,
        previousValue: selectedValue
      })
    }

    // Return unsubscribe function
    return () => {
      this.watchers.delete(id)
    }
  }

  constructor(initialState: StateT) {
    this.initialState = initialState
    this.currentState = initialState
    this.previousState = initialState
    return this
  }

  public get state() {
    return this.currentState
  }

  unsubscribe = (id: string) => {
    this.subscribers.delete(id)
  }

  subscribe = (subscriber: SubscriberT<StateT>) => {
    this.subscribers.set(subscriber.id, subscriber)
    return () => this.unsubscribe(subscriber.id)
  }

  replaceState = (newStateOrUpdater: StateT | DraftFnT<StateT>) => {
    const isFunction = typeof newStateOrUpdater === 'function'
    let newState: StateT

    if (isFunction) {
      const drafter = newStateOrUpdater as DraftFnT<StateT>
      newState = produce(this.currentState, drafter)
    }

    if (!isFunction) newState = newStateOrUpdater
    // no update if state hasn't changed
    if (newState === this.currentState) return
    const oldState = this.currentState
    this.previousState = this.currentState
    this.currentState = newState

    // Notify all subscribers about the state change
    this.subscribers.forEach((subscriber) => {
      if (subscriber.derive) {
        // For subscribers with selectors, only update if selected value changed
        const newResult = subscriber.derive(newState)
        const areEqual = subscriber.previousValue === newResult
        if (!areEqual) {
          subscriber.update(newResult)
          subscriber.previousValue = newResult
        }
      } else if (subscriber.previousValue !== newState) {
        // For subscribers tracking the full state
        subscriber.update(newState)
        subscriber.previousValue = newState
      }
    })

    // Notify all watchers about the state change
    this.watchers.forEach((watcher, id) => {
      if (watcher.selector) {
        // For watchers with selectors
        const newSelectedValue = watcher.selector(newState)
        const oldSelectedValue = watcher.previousValue

        if (newSelectedValue !== oldSelectedValue) {
          watcher.reaction(oldSelectedValue, newSelectedValue)
          watcher.previousValue = newSelectedValue
        }
      } else {
        // For watchers tracking the full state
        watcher.reaction(oldState, newState)
        watcher.previousValue = newState
      }
    })
  }
}
