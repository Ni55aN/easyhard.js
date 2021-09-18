import { $, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map } from 'rxjs/operators'
import { DateActions } from '../../shared'

const client = easyhardClient<DateActions>()

function App() {
  const response = $({ date: new Date() })

  const el = h('div', {},
    h('div', {}, response.pipe(client.pipe('getDate'), map(data => data.date.toLocaleTimeString()))),
    h('div', {}, response.pipe(client.pipe('getDate'), map(data => data.date2.toLocaleTimeString())))
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/date/`), { http: `http://${location.host}/api/date/` }))

  return el
}

document.body.appendChild(App())
