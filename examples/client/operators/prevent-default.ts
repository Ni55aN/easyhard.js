import { MonoTypeOperatorFunction } from 'rxjs'
import { tap } from 'rxjs/operators'

export function preventDefault(): MonoTypeOperatorFunction<Event> {
  return tap<Event>(e => e.preventDefault())
}
