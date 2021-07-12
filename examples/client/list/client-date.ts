import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map } from 'rxjs/operators'
import { Actions } from '../../shared'

const client = easyhardClient<Actions>({
  onClose(event) {
    console.log('onClose', event)
  },
  onConnect() {
    console.log('onConnect')
  },
  onError(err) {
    console.log(err)
  }
})

function App() {
  const response = client.call('getDate', { date: new Date() })

  const el = h('div', {},
    h('div', {}, response.pipe(map(data => data.date.toLocaleTimeString()))),
    h('div', {}, response.pipe(map(data => data.date2.toLocaleTimeString())))
  )

  onMount(el, () => client.connect(`ws://${location.host}/api/basic/`, { http: `http://${location.host}/api/basic/` }))

  return el
}

document.body.appendChild(App())
