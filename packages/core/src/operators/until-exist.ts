import { Observable, MonoTypeOperatorFunction } from 'rxjs'
import { observeElement } from '../mutation-observer'

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>): Observable<T> => new Observable(observer => {
    const values: T[] = []

    if (el) observeElement(el, {
      added() {
        while(values.length > 0) {
          observer.next(values.shift())
        }
      },
      removed() {
        observer.complete()
      }
    })

    return source.subscribe({
      next(value) {
        values.push(value)
        if (Boolean(el) && container.contains(el)) {
          observer.next(values.pop())
          values.splice(0, values.length)
        }
      },
      error(err) { observer.error(err) },
      complete() { observer.complete() }
    })
  })
}