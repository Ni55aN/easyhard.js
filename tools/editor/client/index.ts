import { h } from 'easyhard'
import { EMPTY, Observable } from 'rxjs'
import { catchError, filter, map } from 'rxjs/operators'
import qs from 'qs'
import { createEditor, layout } from './cy-view'
import { easyhardClient } from 'easyhard-client'
import { Actions } from '../shared/bridge'

const client = easyhardClient<Actions>()

client.connect(() => new WebSocket(`ws://${window.location.host}/api/`), { http: `http://${window.location.host}/api/` })

const location = new Observable<Location>(observer => {
  window.addEventListener('popstate', () => observer.next(window.location))
  observer.next(window.location)
})

void async function () {
  const main = h('div', { style: 'width: 100vw; height: 100vh;' })
  document.body.appendChild(main)

  const container = h('div', { style: 'width: 100%; height: 100%; overflow: hidden' })

  main.appendChild(container)

  await new Promise((res) => setTimeout(res, 200))
  const editor = createEditor(container)

  location.pipe(
    map(loc => qs.parse(loc.search, { ignoreQueryPrefix: true }).path),
    filter((path): path is string => Boolean(path) && typeof path === 'string'),
    map(path => ({ path })),
    client.pipe('openFile'),
    catchError((e: Error) => {
      alert(e.toString())
      return EMPTY
    })
  ).subscribe(async cyData => {
    editor.add(cyData.data)

    console.log(editor.nodes().map(n => n.data()))
    await layout(editor)
  })
}()
