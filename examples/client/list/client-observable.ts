import { $, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { interval } from 'rxjs'
import { map } from 'rxjs/operators'
import { ObservableActions } from '../../shared'

const client = easyhardClient<ObservableActions>()

function App() {
  const response = $({ value: interval(5000).pipe(map(v => v * 2)) })

  const el = h('div', {},
    h('div', {}, response.pipe(client.pipe('passObservable'), map(data => data.value)))
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/observable/`), { http: `http://${location.host}/api/observable/` }))

  return el
}

document.body.appendChild(App())
