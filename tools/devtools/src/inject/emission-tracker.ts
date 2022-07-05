import { nanoid } from 'nanoid'
import { Subscription } from 'rxjs'
import { ObservableEmission } from '../types'
import { EhObservable } from './types'

export function emissionTracker(onNext: (arg: ObservableEmission) => void) {
  const observables: EhObservable[] = []
  const subscriptions = new Map<string, Subscription>()
  const emissions = new Map<string, any>()

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
        const sub = ob.__debug.nextBuffer.subscribe(arg => {
          const valueId = nanoid()

          onNext({ id, valueId, ...arg })
          emissions.set(valueId, arg.value)
        })

        subscriptions.set(id, sub)
      }
    },
    get(valueId: string) {
      return emissions.get(valueId)
    }
  }
}
