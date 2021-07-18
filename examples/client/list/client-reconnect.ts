import { h,onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { defer } from 'rxjs'
import { retry } from 'rxjs/operators'
import { map } from 'rxjs/operators'
import { Actions } from '../../shared'

const client = easyhardClient<Actions>({ reconnectDelay: 100 })

function App() {
  const count1 = client.call('getData').pipe(
    map(data => String(data.count)),
    source => defer(() => {
      console.log('subscribed 1')
      return source
    }),
    retry()
  )
  const count2 = client.call('getData').pipe(
    map(data => String(data.count)),
    source => defer(() => {
      console.log('subscribed 2')
      return source
    }),
    retry()
  )

  const el = h('div', {},
    h('div', {}, count1),
    h('div', {}, count2),
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/basic/v2`), { http: `http://${location.host}/api/basic/v2` }))

  return el
}

document.body.appendChild(App())
