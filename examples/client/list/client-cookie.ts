import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Cookie } from 'easyhard-bridge'
import { mapTo, tap } from 'rxjs/operators'
import { CookieActions } from '../../shared'
import { of, pipe } from 'rxjs'

const client = easyhardClient<CookieActions>()

function App() {
  const passCookie = pipe(mapTo({ value: new Cookie('test-cookie') }), client.pipe('sendCookie'), mapTo(null))
  const acceptCookie = pipe(mapTo(undefined), client.pipe('setCookie'), tap(console.log),mapTo(null))

  const el = h('div', {},
    of(null).pipe(passCookie),
    h('button', { click: passCookie }, 'pass cookie'),
    h('button', { click: acceptCookie }, 'accept cookie')
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/cookie/`), { http: `http://${location.host}/api/cookie/` }))

  return el
}

document.body.appendChild(App())
