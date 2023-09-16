import { h, $ } from 'easyhard'
import { map, tap } from 'rxjs/operators'

function App() {
  const b = $('')

  return h('div', {}, b.pipe(map(() => h('b', {}, 'hello, ', $(true).pipe(tap(() => 1), map(() => h('u', {}, 'test')))))))
}

document.body.appendChild(App())
