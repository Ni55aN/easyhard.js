import { Observable, MonoTypeOperatorFunction } from 'rxjs'
import { debugOperator } from '../devtools'
import { observeElement } from '../mutation-observer'

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  const operator = <T>(source: Observable<T>): Observable<T> => new Observable(observer => {
    const values: T[] = []
    const next = () => {
      while(values.length > 0) {
        observer.next(values.shift())
      }
    }

    if (el) observeElement(el, {
      added: next,
      removed() {
        observer.complete()
      }
    })

    return source.subscribe({
      next(value) {
        values.push(value)
        if (Boolean(el) && container.contains(el)) {
          next()
        }
      },
      error(err) { observer.error(err) },
      complete() { observer.complete() }
    })
  })

  debugOperator(operator, 'untilExist', el ? [el] : [])

  return operator
}
