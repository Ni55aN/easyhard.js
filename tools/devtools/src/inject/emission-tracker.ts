import { nanoid } from 'nanoid'
import { Subscription } from 'rxjs'
import { ObservableEmission } from '../types'
import { EhObservable } from './types'

type SubArguments = { id: string, count: number }

export function emissionTracker(onNext: (arg: ObservableEmission) => void, onSub: (props: SubArguments) => void, onUnsub: (props: SubArguments) => void) {
  const observables: EhObservable[] = []
  const subscriptions = new Map<string, Subscription[]>()
  const emissions = new Map<string, any>()

  function add(ob: EhObservable) {
    observables.push(ob)
  }
  function remove(id: string) {
    subscriptions.get(id)?.forEach(sub => sub.unsubscribe())
    subscriptions.delete(id)
  }
  function clear() {
    Array.from(subscriptions.keys()).forEach(remove)
  }
  function flush() {
    while (observables.length) {
      const ob = observables.shift()
      if (!ob) return

      const id = ob.__debug.id

      if (subscriptions.has(id)) return

      const sub = ob.__debug.nextBuffer.subscribe(({ time, value }) => {
        const valueId = nanoid()

        onNext({ id, valueId, time })
        emissions.set(valueId, value)
      })
      const sub2 = ob.__debug.subscribe.subscribe(count => {
        onSub({ id, count })
      })
      const sub3 = ob.__debug.unsubscribe.subscribe(count => {
        onUnsub({ id, count })
      })

      subscriptions.set(id, [sub, sub2, sub3])
    }
  }
  function get(valueId: string) {
    return emissions.get(valueId)
  }

  return {
    add,
    remove,
    clear,
    flush,
    get
  }
}
