import { $$, h, $for } from 'easyhard'
import { merge, Observable } from 'rxjs'
import { map, filter, delay, shareReplay } from 'rxjs/operators'


function applyOpacity(removed: Observable<boolean>): Observable<string> {
  return removed.pipe(map(is => is ? 'opacity: 0.5' : ''))
}

function delayedRemove<T>(list: $$<T>, ms: number) {
  const sharedList = list.pipe(shareReplay())
  const remove = sharedList.pipe(filter(item => 'remove' in item))
  const other = sharedList.pipe(filter(item => !('remove' in item)))

  return {
    list: merge(remove.pipe(delay(ms)), other),
    isRemoved(element: T) {
      return sharedList.pipe(filter(n => 'initial' in n || 'remove' in n && n.item === element), map(item => !('initial' in item)))
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
