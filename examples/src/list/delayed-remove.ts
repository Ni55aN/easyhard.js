import { $$, h, $for } from 'easyhard'
import { pipe, Observable } from 'rxjs'
import { map, filter, mergeMap, delay } from 'rxjs/operators'

const delayRemove = (time: number) => <K, T extends [K, Observable<boolean>]>(source: Observable<T>): Observable<T> => new Observable(observer => {
  return source.subscribe({
    next(value) { observer.next(value) },
    error(err) { observer.error(err) },
    complete() { observer.complete() }
  }).add(source.pipe(mergeMap(value => value[1]), filter(removed => removed), delay(time)).subscribe({
    next() { observer.complete() }
  }))
})

function applyOpacity(removed: Observable<boolean>): Observable<string> {
  return removed.pipe(map(is => is ? 'opacity: 0.5' : ''))
}

function App(): HTMLElement {
  const source = $$([1,2,3,4,5])

  setTimeout(() => source.removeAt(0), 2000)

  return h('div', {},
    $for(source, pipe(delayRemove(3000), map(([item, removed]) => h('div', { style: applyOpacity(removed) }, item))), { detached: true }),
    // $for(source, map(item => h('div', {}, item)))
  )
}

document.body.appendChild(App())