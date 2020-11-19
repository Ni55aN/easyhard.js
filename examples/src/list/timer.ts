import { h } from 'easyhard'
import { timer } from 'rxjs'
import { map, take } from 'rxjs/operators'

function App() {
  const count = timer(0, 1000).pipe(take(31), map(v => 30 - v))

  return h('div', {}, count)
}

document.body.appendChild(App())