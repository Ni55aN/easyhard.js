import { h, $, onMount, $for } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Subject } from 'rxjs'
import { catchError, filter, map, mergeMap, pluck, switchMap, take, tap } from 'rxjs/operators'
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
  const file$ = new Subject<File>()
  const upload$ = file$.pipe(mergeMap(file => client.call('uploadFile', { name: file.name, file })))
  const count1 = client.call('getData').pipe(
    take(5),
    map(data => String(data.count))
  )
  const array = client.call('getArray')
  const num = $(111)
  const count2 = num.pipe(
    switchMap(num => client.call('getDataWithParams', { num })),
    map(data => String(data.count))
  )
  const error = $<Error | null>(null)
  const count3 = client.call('getDataError').pipe(
    map(data => String(data.count)),
    catchError(e => {
      error.next(e)
      return Promise.resolve(null)
    }),
  )
  setTimeout(() => num.next(222), 3000)
  setTimeout(() => num.next(333), 6000)
  setTimeout(() => num.next(444), 9000)

  const el = h('div', {},
    upload$.pipe(pluck('progress')),
    h('input', { type: 'file', change: tap(e => {
      const file = (e.target as HTMLInputElement).files?.item(0)
      if (file) file$.next(file)
    })}),
    h('div', {}, count1),
    h('div', {}, count2),
    h('div', {}, count3),
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

  onMount(el, () => client.connect(`ws://${location.host}/api/basic/`, `http://${location.host}/api/basic/`))

  return el
}

document.body.appendChild(App())
