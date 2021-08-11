import { h,onMount } from 'easyhard'
import { easyhardClient } from 'easyhard-client'
import { defer, interval, of } from 'rxjs'
import { retry } from 'rxjs/operators'
import { map } from 'rxjs/operators'
import { Actions } from '../../shared'

const client = easyhardClient<Actions>({ reconnectDelay: 100 })

function App() {
  const count1 = client.call('getData').pipe(
    map(data => String(data.count)),
    source => defer(() => {
      console.log('subscribed 1')
      return source
    }),
    retry()
  )
  const count2 = client.call('getData').pipe(
    map(data => String(data.count)),
    source => defer(() => {
      console.log('subscribed 2')
      return source
    }),
    retry()
  )
  const withOb1 = of({ value: interval(1000).pipe(map(v => v * 2)) }).pipe(
    client.pipe('passObservable'),
    map(value => value.value),
    source => defer(() => {
      console.log('subscribed 3')
      return source
    }),
    retry()
  )
  const withOb2 = of({ value: interval(1000).pipe(map(v => v * 2)) }).pipe(
    client.pipe('passObservable'),
    map(value => value.value),
    source => defer(() => {
      console.log('subscribed 4')
      return source
    }),
    retry()
  )

  const el = h('div', {},
    h('div', {}, count1),
    h('div', {}, count2),
    h('div', {}, withOb1),
    h('div', {}, withOb2),
  )

  onMount(el, () => client.connect(() => new WebSocket(`ws://${location.host}/api/basic/v2`), { http: `http://${location.host}/api/basic/v2` }))

  return el
}

document.body.appendChild(App())
