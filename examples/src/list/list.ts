import { h, $, $$, $filter, $for } from 'easyhard'
import { timer } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

function App() {
  const arr = new Array(10).fill(0).map((_, i) => i)
  const list = $$(arr)
  // const randomList = timer(0, 500).pipe(
  //   switchMap(() => list.length),
  //   map(length => {
  //     const i = Math.round(Math.random() * (length - 1))

  //     return list.set(i, list.value[i] + 1)
  //   })
  // )

  setTimeout(() => list.set(4, 567), 2000)
  setTimeout(() => list.set(4, 566), 5000)
  setTimeout(() => list.set(4, 563), 6000)

  const filtered = $filter(list, item => item % 2 === 1)

  return h('div', {},
    // randomList,
    $for(list, map(v => h('div', {}, v))),
    h('hr', {}),
    $for(filtered, map(v => h('div', {}, v)))
  )
}

document.body.appendChild(App())