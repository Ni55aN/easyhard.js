import { $, $$, h, $for } from 'easyhard'
import { map } from 'rxjs/operators'

type Item = number

function App(): HTMLElement {
  const source = $([1,2,3,4,5])
  const list = $$<Item>([])

  return h('div', {},
    source.pipe(
      map(items => {
        list.clear()
        items.forEach(item => list.insert(item))

        return null
      })
    ),
    $for(list, map(item => h('div', {}, item)))
  )
}

document.body.appendChild(App())