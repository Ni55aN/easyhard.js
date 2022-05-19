import { defer, Observable, Subscriber } from 'rxjs'
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

export function mapWithSubscriber<T, R>(project: (value: T, subscriber: Subscriber<R>) => R) {
  return (source: Observable<T>): Observable<unknown> => new Observable<R>(observer => {
    return source.subscribe({
      error: (error: R) => observer.next(error),
      complete: () => observer.complete(),
      next: value => observer.next(project(value, observer))
    })
  })
}
