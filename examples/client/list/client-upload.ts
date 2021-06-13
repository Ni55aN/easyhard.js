import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Subject, throwError } from 'rxjs'
import { catchError, mergeMap, pluck, takeUntil, tap } from 'rxjs/operators'
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
  const abort$ = new Subject<any>()
  const upload$ = file$.pipe(mergeMap(file => {
    return client.call('uploadFile', { name: file.name, file, size: file.size }).pipe(
      takeUntil(abort$),
      catchError((err: Error) => {
        console.log('err', err)
        return throwError(() => err)
      })
    )
  }))

  const el = h('div', {},
    upload$.pipe(pluck('progress')),
    h('input', { type: 'file', change: tap(e => {
      const file = (e.target as HTMLInputElement).files?.item(0)
      if (file) file$.next(file)
    })}),
    h('button', { click: abort$ }, 'Abort')
  )

  onMount(el, () => client.connect(`ws://${location.host}/api/basic/`, `http://${location.host}/api/basic/`))

  return el
}

document.body.appendChild(App())
