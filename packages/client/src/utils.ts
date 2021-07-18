import { defer, Observable } from 'rxjs'
import { finalize } from 'rxjs/operators'

export async function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export function mount<T>(onMount: () => () => void) {
  return (source: Observable<T>): Observable<T> => defer(() => {
    const destroy = onMount()
    return source.pipe(
      finalize(() => destroy())
    )
  })
}
