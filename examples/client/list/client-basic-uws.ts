import { $, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map, take } from 'rxjs/operators'
import { BasicActionsUWS } from '../../shared'

const client = easyhardClient<BasicActionsUWS>()

function App() {
  const count1 = client.call('getData').pipe(
    take(5),
    map(data => String(data.count))
  )
  const count2 = $(undefined).pipe(
    client.pipe('getIP'),
    map(data => String(data.ip))
  )

  const el = h('div', {},
    h('div', {}, count1),
    h('div', {}, count2)
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/uws/basic/`), { http: `http://${location.host}/uws/basic/` }))

  return el
}

document.body.appendChild(App())
