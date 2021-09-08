import { $, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map } from 'rxjs/operators'
import { Actions } from '../../shared'

const client = easyhardClient<Actions>()

function App() {

  const el = h('div', {},
    h('div', {}, 'My IP:', $(undefined).pipe(client.pipe('requestData'), map(params => params.ip)))
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/basic/`), { http: `http://${location.host}/api/basic/` }))

  return el
}

document.body.appendChild(App())
