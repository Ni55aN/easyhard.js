import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Subject, throwError } from 'rxjs'
import { catchError, map, pluck, takeUntil, tap } from 'rxjs/operators'
import { UploadActions } from '../../shared'

const client = easyhardClient<UploadActions>()

function App() {
  const file$ = new Subject<File>()
  const abort$ = new Subject<any>()
  const upload$ = file$.pipe(
    map(file => ({ name: file.name, file, size: file.size })),
    client.pipe('uploadFile'),
    takeUntil(abort$),
    catchError((err: Error) => {
      console.log('err', err)
      return throwError(() => err)
    })
  )

  const el = h('div', {},
    upload$.pipe(pluck('progress'), map(p => p.toFixed(2))),
    h('input', { type: 'file', change: tap(e => {
      const file = (e.target as HTMLInputElement).files?.item(0)
      if (file) file$.next(file)
    })}),
    h('button', { click: abort$ }, 'Abort')
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/upload/`), { http: `http://${location.host}/api/upload/` }))

  return el
}

document.body.appendChild(App())
