import { $, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map } from 'rxjs/operators'
import { RequestActions } from '../../shared'

const client = easyhardClient<RequestActions>()

function App() {

  const el = h('div', {},
    h('div', {}, 'My IP:', $(undefined).pipe(client.pipe('requestData'), map(params => params.ip)))
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/request/`), { http: `http://${location.host}/api/request/` }))

  return el
}

document.body.appendChild(App())
