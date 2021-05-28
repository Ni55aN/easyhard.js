import { h, $, $$, $for } from 'easyhard'
import { timer } from 'rxjs'
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators'



function App() {
  const arr = new Array(10).fill(0).map((_, i) => i)
  const list = $$(arr.map((v, i) => [i, $(v)] as [number, $<number>]))
  const randomList = list.length.pipe(
    distinctUntilChanged(),
    switchMap(length => timer(0, 500).pipe(
      map(() => {
        console.log(length)
        const i = Math.round(Math.random() * (length - 1))
        const subj = list.value[i][1]

        return subj.next(subj.value + 1)
      })
    ))
  )

  setTimeout(() => {
    list.value[5][1].next(567)
    list.insert([4,$(88)])
  }, 3000)

  return h('div', {},
    randomList,
    $for(list, map(v => h('div', {}, v[1])), { comparator: (a, b) => a[0] <= b[0]})
  )
}

document.body.appendChild(App())
