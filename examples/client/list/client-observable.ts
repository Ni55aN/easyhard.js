import { $, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { interval } from 'rxjs'
import { map } from 'rxjs/operators'
import { Actions } from '../../shared'

const client = easyhardClient<Actions>()

function App() {
  const response = $({ value: interval(1000).pipe(map(v => v * 2)) })

  const el = h('div', {},
    h('div', {}, response.pipe(client.pipe('passObservable'), map(data => data.value)))
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/basic/`), { http: `http://${location.host}/api/basic/` }))

  return el
}

document.body.appendChild(App())
