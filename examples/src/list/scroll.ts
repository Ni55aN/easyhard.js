import { h, $, $$, $for, SimpleType, DomElement } from 'easyhard'
import { OperatorFunction, Observable, combineLatest } from 'rxjs'
import { map, tap, debounceTime, mapTo } from 'rxjs/operators'
import { intersection, difference } from 'lodash-es'

function observeResize() {
  return new Observable<{ width: number; height: number }>((observer) => {
    const handle = () => observer.next({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handle, false)
    handle()

    return () => window.removeEventListener('resize', handle)
  })
}

function ListView<T>(list: $$<T>, props: { height: number }, render: OperatorFunction<T, DomElement | SimpleType>) {
  const scrollTop = $(0)
  const size = observeResize()
  const visibleList = $$<T>([])
  function updateList(offset: number, height: number) {
    const startIndex = offset
    const numberOfItems = Math.ceil(height / props.height)
    const endIndex = offset + numberOfItems

    const oldItems = visibleList.value
    const nextItems = list.value.slice(startIndex, endIndex)
    const outdated = difference(oldItems, nextItems)
    const present = intersection(oldItems, nextItems)

    outdated.forEach(item => visibleList.remove(item))
    nextItems.forEach((item, i) => {
      if (present.includes(item)) return
      visibleList.insert(item, i)
    })
  }

  const offset = scrollTop.pipe(map(top => Math.floor(top/props.height)))
  const height = size.pipe(map(({ height }) => height))

  return h('div', {
        style: 'height: 100%; overflow: auto',
        scroll: tap(e => scrollTop.next((e.srcElement as HTMLElement).scrollTop))
      },
      combineLatest([offset, height]).pipe(
        debounceTime(16),
        tap(([offset, height]) => updateList(offset, height)),
        mapTo(null)
      ),
      h('div', {
          style: list.length.pipe(map(value => `height: ${value * props.height}px; overflow: hidden;`)),
        },
          h('div', { style: offset.pipe(debounceTime(16), map((offset) => `transform: translateY(${offset * props.height}px)`))},
            $for(visibleList, render),
          )
      )
  )
}

function App() {
  const arr = $$(new Array(10000).fill(0).map((_, i) => i))
  const renderItem = map<number, any>(item => {
    for(let i = 0; i < 10000; i += Math.random()) i += Math.random()
    return h('div', {}, item)
  })

  return h('div', {  style: 'height: 80vh; border: 1px solid red; overflow: auto' },
    // $for(arr, renderItem),
    ListView(arr, { height: 18.4 }, renderItem)
  )
}

document.body.appendChild(App())