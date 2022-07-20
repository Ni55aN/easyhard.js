import { defer, Observable } from 'rxjs'
import { finalize } from 'rxjs/operators'

export function mount<T>(onMount: () => () => void) {
  return (source: Observable<T>): Observable<T> => defer(() => {
    const destroy = onMount()
    return source.pipe(
      finalize(() => destroy())
    )
  })
}
