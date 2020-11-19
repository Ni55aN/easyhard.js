import { h, $, $$, $for } from 'easyhard'
import { map, tap } from 'rxjs/operators'

function App() {
  const list = $$(new Array(10000).fill(null).map((_, i) => $(i)))
  const increment = () => list.value.forEach(v => v.next(v.value + 1))

  return h('div', {},
    h('button', { click: tap(increment) }, 'inc'),
    $for(list, map(v => h('div', {}, v)))
  )
}

document.body.appendChild(App())