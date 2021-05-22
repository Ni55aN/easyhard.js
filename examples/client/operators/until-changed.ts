import { Observable, MonoTypeOperatorFunction } from 'rxjs'

export function takeUntilChanged<T>(notifier: Observable<any>, offset = 0): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => new Observable(observer => {
    const sub1 = notifier.subscribe({
      next() { if (--offset < 0) observer.complete() }
    })
    const sub2 = source.subscribe({
      next(val) { observer.next(val) },
      complete() { observer.complete() }
    })

    return () => {
      sub1.unsubscribe()
      sub2.unsubscribe()
    }
  })
}