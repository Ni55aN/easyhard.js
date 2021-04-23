import { h, $, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map, switchMap, take, tap } from 'rxjs/operators'
import { Actions } from '../../shared'

const client = easyhardClient<Actions>({
  onClose(event) {
    console.log('onClose', event)
  },
  onConnect() {
    console.log('onConnect');
  },
  onError(err) {
    console.log(err);
  }
})

function App() {
  const count1 = client.call('getData').pipe(take(5), map(data => String(data.count)))
  const num = $(111)
  const count2 = num.pipe(
    switchMap(num => client.call('getDataWithParams', { num })),
    map(data => String(data.count))
  )
  setTimeout(() => num.next(222), 3000)
  setTimeout(() => num.next(333), 6000)
  setTimeout(() => num.next(444), 9000)

  const el = h('div', {}, count1, '|', count2)

  onMount(el, () => client.connect(`ws://${location.host}/api/`))

  return el
}

document.body.appendChild(App())
