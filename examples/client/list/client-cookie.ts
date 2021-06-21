import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Cookie } from 'easyhard-bridge'
import { mapTo, mergeMap, tap } from 'rxjs/operators'
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
  const passCookie = client.call('sendCookie', { value: new Cookie('test-cookie') }).pipe(mapTo(null))
  const acceptCookie = client.call('setCookie').pipe(tap(console.log),mapTo(null))

  const el = h('div', {},
    passCookie,
    h('button', { click: mergeMap(() => passCookie) }, 'pass cookie'),
    h('button', { click: mergeMap(() => acceptCookie) }, 'accept cookie')
  )

  onMount(el, () => client.connect(`ws://${location.host}/api/basic/`, { http: `http://${location.host}/api/basic/` }))

  return el
}

document.body.appendChild(App())
