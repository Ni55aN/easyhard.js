/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const n = merge(remove.pipe(delay(ms)), other)

  ;(n as any).__debug.groupName = 'delayedRemove'
  ;(n as any).__debug.groupStart = (sharedList as any).__debug.id

  return {
    list: n,
    isRemoved(element: T) {
      const start = sharedList.pipe(filter(n => 'initial' in n || 'remove' in n && n.item === element))
      const end = start.pipe(map(item => !('initial' in item)))

      ;(end as any).__debug.groupName = 'delayedRemove'
      ;(end as any).__debug.groupStart = (start as any).__debug.id
      return end
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
