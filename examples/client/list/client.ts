import { h, $, onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { map, tap } from 'rxjs/operators'
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
  const count = client.call('getData').pipe(map(data => String(data.count)))
  const el = h('div', {}, count)

  onMount(el, () => client.connect(`ws://${location.host}/api/`))

  return el
}

document.body.appendChild(App())