import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Cookie } from 'easyhard-common'
import { mapTo, mergeMap } from 'rxjs/operators'
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
  const set = client.call('sendCookie', { value: new Cookie('test-cookie') }).pipe(mapTo(null))

  const el = h('div', {},
    set,
    h('button', { click: mergeMap(() => set) }, 'set cookie')
  )

  onMount(el, () => client.connect(`ws://${location.host}/api/basic/`, `http://${location.host}/api/basic/`))

  return el
}

document.body.appendChild(App())
