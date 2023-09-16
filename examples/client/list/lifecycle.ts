import { h, $if, onMount, onDestroy } from 'easyhard'
import { Observable, interval, Subject } from 'rxjs'
import { map, tap, startWith, scan } from 'rxjs/operators'

function Child(text: Observable<string>) {
  const mountInfo = new Observable<void>(() =>{
    console.info('onMount (legacy)')
    return () => console.info('onDestroy (legacy)')
  })
  console.info('onCreate')

  const container = document.createElement('div')

  onMount(container, () => console.info('onMount (html)'))
  onDestroy(container, () => console.info('onDestroy (html)'))

  return h('div', {},
    container,
    mountInfo,
    text.pipe(tap(() => console.info('onUpdate')))
  )
}


function App() {
  const text = interval(100).pipe(map(n => `number: ${n}`))
  const toggle = new Subject<MouseEvent>()
  const mount = toggle.pipe(startWith(false), scan(acc => !acc, false))

  return h('div', {},
    h('button', { click: toggle, mouseenter: tap(console.log) }, 'toggle'),
    $if(mount, () => Child(text))
  )
}

document.body.appendChild(App())
