import { $, $for, h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { of } from 'rxjs'
import { catchError, filter, map, take } from 'rxjs/operators'
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
  const error = $<Error | null>(null)
  const count3 = client.call('getDataError').pipe(
    map(data => String(data.count)),
    catchError((e: Error) => {
      error.next(e)
      return Promise.resolve(null)
    }),
  )

  const el = h('div', {},
    h('div', {}, count1),
    h('div', {}, count2),
    h('div', {}, count3),
    of({ value: 123 }).pipe(client.pipe('emptyResponse')),
    of({ value: 456 }).pipe(client.pipe('emptyResponse2')),
    h('div', { style: 'color: red' },
      error.pipe(
        filter((e): e is Error => Boolean(e)),
        map(e => `Error: ${e.message}`)
      )
    ),
    h('div', {},
      $for(array, map(item => h('b', {}, item)))
    )
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/basic/`), { http: `http://${location.host}/api/basic/` }))

  return el
}

document.body.appendChild(App())
