import { Observable, Subscription } from 'rxjs'
import { retry } from 'rxjs/operators'

export function useEffects() {
  const subscriptions: Subscription[] = []

  return {
    add<T>(ob: Observable<T>) {
      subscriptions.push(ob.pipe(retry()).subscribe())
    },
    dispose() {
      subscriptions.forEach(sub => sub.unsubscribe())
      subscriptions.splice(0)
    }
  }
}
