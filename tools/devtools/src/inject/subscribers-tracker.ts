import { EhSubscriber, ReplayBufferSubscription } from '../dom-types'

type SubscriptionSet = { subs: ReplayBufferSubscription[], sources: Set<EhSubscriber> }

export class SubscribersTracker {
  subs = new Map<EhSubscriber, SubscriptionSet>()

  constructor(private events: { added: (sub: EhSubscriber, props?: any) => void,  removed: (sub: EhSubscriber) => void, next: (sub: EhSubscriber, v: any) => void }) {}

  add(subscriber: EhSubscriber, props?: any) {
    if (!subscriber.__debug) throw new Error('subscriber.__debug')
    if (this.subs.has(subscriber)) return

    const data: SubscriptionSet = { subs: [], sources: new Set() }
    this.subs.set(subscriber, data)
    this.events.added(subscriber, props)

    const { nextBuffer, sources } = subscriber.__debug

    data.subs.push(nextBuffer.subscribe((value: any) => {
      this.events.next(subscriber, value)
    }))

    data.subs.push(sources.subscribe((s: { add: EhSubscriber } | { remove: EhSubscriber }) => {
      if ('add' in s) {
        this.add(s.add)
        data.sources.add(s.add)
      }
      if ('remove' in s) {
        this.remove(s.remove)
        data.sources.delete(s.remove)
      }
    }))
  }

  remove(subscriber: EhSubscriber) {
    const data = this.subs.get(subscriber)

    if (data) {
      data.subs.forEach((sub: any) => sub.unsubscribe())
      this.events.removed(subscriber)
      this.subs.delete(subscriber)
      data.sources.forEach(source => this.remove(source))
    }
  }
}
