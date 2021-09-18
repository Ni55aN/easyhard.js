import { interval, Observable } from 'rxjs'
import { map, mergeMap, take } from 'rxjs/operators'
import { PassObservable } from '../../shared'

export function getInterval(): Observable<{ count: number }> {
  return interval(1000).pipe(
    take(10),
    map(count => ({ count }))
  )
}

export function passObservable(): PassObservable {
  return mergeMap((params: { value: Observable<number> }) => {
    return params.value.pipe(map(value => ({ value })))
  })
}
