import { ReplaySubject } from 'rxjs'
import { ObservableEmission, SubsPayload } from '../types'
import { EhSubscriber, JsonSubscriber } from '../dom-types'

export function emissionTracker() {
  const subscribers = new Map<string, any>()
  const subscriptions = new ReplaySubject<SubsPayload>()
  const valuesCache = new Map<string, any>()
  const values = new ReplaySubject<ObservableEmission>()

  function add(sub: EhSubscriber | JsonSubscriber) {
    if (!sub.__debug?.observable) return
    const source: string = sub.__debug.observable.__debug.id

    subscribers.set(source, [...(subscribers.get(source) || []), sub])
    subscriptions.next({ subscribe: { id: source, count: subscribers.get(source).length }})
  }
  function remove(sub: EhSubscriber | JsonSubscriber) {
    if (!sub.__debug?.observable) throw new Error('doesnt have observable')
    const source: string = sub.__debug.observable.__debug.id

    subscribers.set(source, (subscribers.get(source) || []).filter((s: any) => s !== sub))
    const count = subscribers.get(source).length

    subscriptions.next({ subscribe: { id: source, count }})

    return { count }
  }

  function next(sub: EhSubscriber | JsonSubscriber, { value, valueId, time }: { value: any, valueId: string, time: number }) {
    if (!sub.__debug?.observable) throw new Error('doesnt have observable')
    const id = sub.__debug.observable.__debug.id

    values.next({
      id,
      valueId,
      time,
      subscriberId: sub.__debug.id,
      sourceSubscriberIds: 'sourcesId' in sub.__debug ? sub.__debug.sourcesId : sub.__debug.sources.snapshot().map((s: any) => s.__debug.id)
    })
    valuesCache.set(valueId, value)
  }

  function get(valueId: string) {
    return valuesCache.get(valueId)
  }

  return {
    add,
    remove,
    next,
    get,
    subscriptions,
    values
  }
}
