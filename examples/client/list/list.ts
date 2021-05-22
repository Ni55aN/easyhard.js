import { h, $, $$, $for } from 'easyhard'
import { timer } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

function App() {
  const arr = new Array(10).fill(0).map((_, i) => i)
  const list = $$(arr.map(v => $(v)))
  const randomList = timer(0, 500).pipe(
    switchMap(() => list.length),
    map(length => {
      const i = Math.round(Math.random() * (length - 1))
      const subj = list.value[i]

      return subj.next(subj.value + 1)
    })
  )

  setTimeout(() => list.value[5].next(567), 3000)

  return h('div', {},
    randomList,
    $for(list, map(v => h('div', {}, v)))
  )
}

document.body.appendChild(App())