import { ReplaySubject } from 'rxjs'
import { ObservableEmission, SubsPayload } from '../types'
import { EhSubscriber, JsonSubscriber, JsonSubscriberValue, SubscriberValue } from '../dom-types'

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

  function next(sub: EhSubscriber | JsonSubscriber, props: JsonSubscriberValue | SubscriberValue) {
    if (!sub.__debug?.observable) throw new Error('doesnt have observable')
    const id = sub.__debug.observable.__debug.id
    const { valueId, time } = props

    values.next({
      id,
      valueId,
      time,
      subscriberId: sub.__debug.id,
      sourceSubscriberIds: 'sourcesId' in sub.__debug ? sub.__debug.sourcesId : sub.__debug.sources.snapshot().map((s: any) => s.__debug.id)
    })
    if ('value' in props) {
      valuesCache.set(valueId, props.value)
    }
  }

  function has(valueId: string) {
    return valuesCache.has(valueId)
  }

  function get(valueId: string) {
    return valuesCache.get(valueId)
  }

  return {
    add,
    remove,
    next,
    has,
    get,
    subscriptions,
    values
  }
}
