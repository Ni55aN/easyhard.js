import { nanoid } from 'nanoid'
import { Subscription } from 'rxjs'
import { ObservableEmission } from '../types'
import { EhObservable } from './types'

export function emissionTracker(onNext: (arg: ObservableEmission) => void) {
  const observables: EhObservable[] = []
  const subscriptions = new Map<string, Subscription>()
  const emissions = new Map<string, any>()

  function add(ob: EhObservable) {
    observables.push(ob)
  }
  function remove(id: string) {
    subscriptions.get(id)?.unsubscribe()
    subscriptions.delete(id)
  }
  function clear() {
    Object.keys(subscriptions).forEach(remove)
  }
  function flush() {
    while (observables.length) {
      const ob = observables.shift()
      if (!ob) return

      const id = ob.__debug.id
      remove(id)

      const sub = ob.__debug.nextBuffer.subscribe(({ time, value }) => {
        const valueId = nanoid()

        onNext({ id, valueId, time })
        emissions.set(valueId, value)
      })

      subscriptions.set(id, sub)
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
