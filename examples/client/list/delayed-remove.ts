import { $$, h, $for } from 'easyhard'
import { Observable, of } from 'rxjs'
import { map, filter, mergeMap, delay, startWith, mapTo } from 'rxjs/operators'


function applyOpacity(removed: Observable<boolean>): Observable<string> {
  return removed.pipe(map(is => is ? 'opacity: 0.5' : ''))
}

function delayedRemove<T>(list: $$<T>, ms: number) {
  return {
    list: list.pipe(mergeMap(item => 'remove' in item ? of(item).pipe(delay(ms)) : of(item))),
    isRemoved(element: T) {
      return list.pipe(filter(n => 'remove' in n && n.item === element), mapTo(true), startWith(false))
    }
  }
}

function App(): HTMLElement {
  const source = $$([1,2,3,4,5])
  const { list, isRemoved } = delayedRemove(source, 3000)

  setTimeout(() => source.remove(1), 2000)

  return h('div', {},
    $for(list, item => h('div', { style: applyOpacity(isRemoved(item)) }, item))
    // $for(source, map(item => h('div', {}, item)))
  )
}

document.body.appendChild(App())
