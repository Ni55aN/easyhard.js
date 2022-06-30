import { Subscription } from 'rxjs'
import { EhObservable } from './types'

export function emissionTracker(onNext: (arg: { id: string, time: number,  value: any}) => void) {
  const observables: EhObservable[] = []
  const subscriptions = new Map<string, Subscription>()

  return {
    add(ob: EhObservable) {
      observables.push(ob)
    },
    remove(id: string) {
      subscriptions.get(id)?.unsubscribe()
    },
    flush() {
      while (observables.length) {
        const ob = observables.shift()
        if (!ob) return
        const id = ob.__debug.id
        const sub = ob.__debug.nextBuffer.subscribe(arg => onNext({ id, ...arg }))

        subscriptions.set(id, sub)
      }
    }
  }
}
