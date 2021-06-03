import { h, $, $$, $for, SimpleType, DomElement, appendChild } from 'easyhard'
import { OperatorFunction, Observable, combineLatest, pipe } from 'rxjs'
import { map, tap, debounceTime, mapTo } from 'rxjs/operators'
import { intersection, difference } from 'lodash-es'
import { collectionLength } from 'easyhard-common'

function observeResize() {
  return new Observable<{ width: number; height: number }>((observer) => {
    const handle = () => observer.next({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handle, false)
    handle()

    return () => window.removeEventListener('resize', handle)
  })
}

function createVirtualList<T>(sourceList: $$<T>, scrollTop: $<number>, containerHeight: $<number>, itemHeight: $<number>) {
  const list = $$<T>([])
  const offset = $(0)

  function update(itemHeight: number, containerHeight: number, scrollTop: number) {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const numberOfItems = Math.ceil(containerHeight / itemHeight)
    const endIndex = startIndex + numberOfItems + 1

    const oldItems = list.value
    const nextItems = sourceList.value.slice(startIndex, endIndex)
    const outdated = difference(oldItems, nextItems)
    const present = intersection(oldItems, nextItems)

    outdated.forEach(item => list.remove(item))
    nextItems.forEach(item => {
      if (present.includes(item)) return
      list.insert(item)
    })
    offset.next(startIndex * itemHeight)
  }

  return {
    inject: combineLatest([sourceList, itemHeight, containerHeight, scrollTop]).pipe(
      tap(([_, itemHeight, containerHeight, scrollTop]) => update(itemHeight, containerHeight, scrollTop)),
      mapTo(null)
    ),
    list,
    update,
    offset: offset.asObservable(),
    sourceHeight: combineLatest([sourceList.pipe(collectionLength()), itemHeight]).pipe(map(([value, itemHeight]) => value * itemHeight))
  }
}

function ListView<T>(source: $$<T>, props: { height: $<number> }, render: OperatorFunction<T, DomElement | SimpleType>) {
  const scrollTop = $(0)
  const containerHeight = $(0)
  const { inject, list, sourceHeight, offset } = createVirtualList<T>(source, scrollTop, containerHeight, props.height)

  const container: HTMLElement = h('div', {
      style: 'height: 100%; overflow: auto',
      scroll: pipe(
        debounceTime(16),
        map(e => scrollTop.next((e.srcElement as HTMLElement).scrollTop))
      )
    },
    inject,
    h('div', { style: sourceHeight.pipe(map(h => `height: ${h}px; overflow: hidden;`)) },
      h('div', { style: offset.pipe(map((offset) => `transform: translateY(${offset}px)`)) },
        $for(list, render, { comparator: (a, b) => a <= b }),
      )
    )
  )

  appendChild(observeResize().pipe(
    tap(() => requestAnimationFrame(() => containerHeight.next(container.clientHeight))),
    mapTo(null)
  ), container)

  return container
}

function App() {
  const arr = $$(new Array(10000).fill(0).map((_, i) => i))
  const renderItem = map<number, any>(item => {
    for(let i = 0; i < 10000; i += Math.random()) i += Math.random()
    return h('div', {}, item)
  })

  return h('div', {  style: 'height: 80vh; border: 1px solid red; overflow: auto' },
    // $for(arr, renderItem),
    ListView(arr, { height: $(18.4) }, renderItem)
  )
}

document.body.appendChild(App())
