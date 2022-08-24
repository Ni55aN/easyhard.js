import { $, $$, $for, h } from 'easyhard'
import { map, tap } from 'rxjs/operators'
import { injectStyles } from 'easyhard-styles'
import { createEditor, layout } from './cy-view'
import cytoscape from 'cytoscape'
import { easyhardClient } from 'easyhard-client'
import { Actions } from '../shared/bridge'

const client = easyhardClient<Actions>()

client.connect(() => new WebSocket(`ws://${location.host}/api/`), { http: `http://${location.host}/api/` })

void async function () {
  const tabs = $$<{ name: string, editor: cytoscape.Core }>([])
  const containers = $$<{ name: string, el: HTMLElement }>([])
  const current = $<string | null>(null)
  const main = h('div', { style: 'width: 100vw; height: 100vh;' },
    h('div', {}, injectStyles({ position: 'absolute', top: 0, left: 0 }),
      $for(tabs, v => h('button', { click: tap(() => openScope(v.name))}, v.name)),
    ),
    $for(containers, v => v.el)
  )
  document.body.appendChild(main)

  async function insertTab() {
    const name = Math.random().toFixed(3)
    const container = h('div', { style: current.pipe(map(c => c === name ? 'width: 100%; height: 100%; overflow: hidden' : 'visibility: hidden'))})
    containers.insert({ name, el: container })
    await new Promise((res) => setTimeout(res, 200))
    const editor = createEditor(container)

    client.call('getData').subscribe(async cyData => {
      editor.add(cyData.data)

      console.log(editor.nodes().map(n => n.data()))
      await layout(editor)
    })

    tabs.insert({ name, editor })

    return name
  }
  async function openScope(name: string) {
    current.next(name)
  }
  openScope(await insertTab())
}()
