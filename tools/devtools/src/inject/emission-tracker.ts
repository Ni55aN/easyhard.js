import { nanoid } from 'nanoid'
import { ReplaySubject, Subscription } from 'rxjs'
import { ObservableEmission, SubsPayload } from '../types'
import { EhObservable } from '../dom-types'

export function emissionTracker() {
  const trackedSubscriptions = new Map<string, Subscription>()
  const valuesCache = new Map<string, any>()
  const subscriptions = new ReplaySubject<SubsPayload>()
  const values = new ReplaySubject<ObservableEmission>()

  function add(ob: EhObservable) {
    const { __debug } = ob
    const { id, nextBuffer, subscribe, unsubscribe } = __debug
    const subscription = new Subscription()

    if (trackedSubscriptions.has(id)) return

    subscription.add(nextBuffer.subscribe(({ time, value }) => {
      const valueId = nanoid()

      values.next({ id, valueId, time })
      valuesCache.set(valueId, value)
    }))
    subscription.add(subscribe.subscribe(count => {
      subscriptions.next({ subscribe: { id, count }})
    }))
    subscription.add(unsubscribe.subscribe(count => {
      subscriptions.next({ unsubscribe: { id, count }})
    }))

    trackedSubscriptions.set(id, subscription)
  }
  function remove(id: string) {
    trackedSubscriptions.get(id)?.unsubscribe()
    trackedSubscriptions.delete(id)
  }
  function clear() {
    Array.from(trackedSubscriptions.keys()).forEach(remove)
  }
  function get(valueId: string) {
    return valuesCache.get(valueId)
  }

  return {
    add,
    remove,
    clear,
    get,
    subscriptions,
    values
  }
}
