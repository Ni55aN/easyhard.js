import { h, $, $$, $for, Child } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { Observable, of, pipe, timer } from 'rxjs'
import { delay, delayWhen, map, mapTo, mergeMap, tap } from 'rxjs/operators'

type Item<T> = { id: string, value: T, visible: $<boolean> }

const containerStyles = (visible: Observable<boolean>, duration: Observable<number> ) => css({
  transition: duration.pipe(map(v => `${v / 2 / 1000}s`)),
  opacity: visible.pipe(map(v => v ? '1' : '0')),
  height: visible.pipe(mergeMap(v => v ? of('45px') : of('0px').pipe(delay(500)))),
  overflow: 'hidden'
})

function useFadeList<T>(arr: T[], { duration }: { duration: Observable<number> }) {
  const list = $$<Item<T>>(arr.map(value => ({ id: Math.random().toString(36), value, visible: $<boolean>(true) })))

  return {
    list,
    container(item: Item<T>, ...children: Child[]) {
      return h('div', {}, injectStyles(containerStyles(item.visible, duration)), ...children)
    },
    remove: pipe(
      tap<Item<T>>(item => item.visible.next(false)),
      delayWhen(() => duration.pipe(mergeMap(d => timer(d)), tap(console.log), )),
      tap(item => list.remove(item))
    )
  }
}

const itemStyles = css({
  padding: '0.6em',
  background: '#fe6e51',
  margin: '0.3em'
})

function App() {
  const arr = new Array(10).fill(0).map((_, i) => i)
  const { list, container, remove } = useFadeList(arr, { duration: $(1000) })

  return h('div', {},
    $for(list, v => container(v, h('div', {
      click: pipe(mapTo(v), remove) },
    injectStyles(itemStyles),
    v.value
    )))
  )
}

document.body.appendChild(App())
