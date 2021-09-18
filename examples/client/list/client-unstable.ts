import { h,onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { defer, interval, of } from 'rxjs'
import { retry } from 'rxjs/operators'
import { map } from 'rxjs/operators'
import { UnstableActions } from '../../shared'

const client = easyhardClient<UnstableActions>({ reconnectDelay: 100 })

function App() {
  const a = of({ value: interval(100).pipe(map(v => v * 2)) }).pipe(
    client.pipe('passObservable'),
    map(value => value.value),
    source => defer(() => {
      console.log('subscribed 3')
      return source
    }),
    retry()
  )
  const b = of({ value: interval(100).pipe(map(v => v * 2)) }).pipe(
    client.pipe('passObservable'),
    map(value => value.value),
    source => defer(() => {
      console.log('subscribed 4')
      return source
    }),
    retry()
  )

  const el = h('div', {},
    h('div', {}, a),
    h('div', {}, b),
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/unstable`), { http: `http://${location.host}/api/unstable` }))

  return el
}

document.body.appendChild(App())
