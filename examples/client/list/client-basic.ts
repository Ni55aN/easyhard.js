import { $, $for, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { of } from 'rxjs'
import { catchError, ignoreElements, map, take } from 'rxjs/operators'
import { BasicActions } from '../../shared'

const client = easyhardClient<BasicActions>()

function App() {
  const count1 = client.call('getData').pipe(
    take(5),
    map(data => String(data.count))
  )
  const array = client.call('getArray')
  const num = $(111)
  const count2 = num.pipe(
    map(num => ({ num })),
    client.pipe('getDataWithParams'),
    map(data => String(data.count))
  )
  const count3 = client.call('getDataError').pipe(
    map(data => String(data.count)),
  )
  const error = count3.pipe(
    ignoreElements(),
    catchError((e: Error) => $(e))
  )

  const el = h('div', {},
    h('div', {}, count1),
    h('div', {}, count2),
    h('div', {}, count3.pipe(catchError(() => Promise.resolve(null)))),
    of({ value: 123 }).pipe(client.pipe('emptyResponse')),
    of({ value: 456 }).pipe(client.pipe('emptyResponse2')),
    h('div', { style: 'color: red' },
      error.pipe(
        map(e => `Error: ${e.message}`)
      )
    ),
    h('div', {},
      $for(array, item => h('b', {}, item))
    )
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/basic/`), { http: `http://${location.host}/api/basic/` }))

  return el
}

document.body.appendChild(App())
