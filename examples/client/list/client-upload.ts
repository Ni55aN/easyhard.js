import { h, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { Subject } from 'rxjs'
import { mergeMap, pluck, tap } from 'rxjs/operators'
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
  const upload$ = file$.pipe(mergeMap(file => client.call('uploadFile', { name: file.name, file, size: file.size })))

  const el = h('div', {},
    upload$.pipe(pluck('progress')),
    h('input', { type: 'file', change: tap(e => {
      const file = (e.target as HTMLInputElement).files?.item(0)
      if (file) file$.next(file)
    })})
  )

  onMount(el, () => client.connect(`ws://${location.host}/api/basic/`, `http://${location.host}/api/basic/`))

  return el
}

document.body.appendChild(App())
