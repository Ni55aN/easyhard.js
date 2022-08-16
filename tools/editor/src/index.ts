import { $, $$, $for, h } from 'easyhard'
import { map, tap } from 'rxjs/operators'
import { injectStyles } from 'easyhard-styles'
import { parse } from 'recast/parsers/typescript'
import { Node as ASTNode } from '@babel/types'
import { createEditor, layout } from './cy-view'
import { process } from './transpiler'
import source from './assets/easyhard?raw'
import cytoscape from 'cytoscape'
import { cytoscapeAdapter } from './cy-view/adapter'

const tsAst = parse(source)

console.log('Source', source)
console.log('Root', tsAst.program.body)

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

  async function insertTab(ast: ASTNode) {
    const name = Math.random().toFixed(3)
    const container = h('div', { style: current.pipe(map(c => c === name ? 'width: 100%; height: 100%; overflow: hidden' : 'visibility: hidden'))})
    containers.insert({ name, el: container })
    await new Promise((res) => setTimeout(res, 200))
    const editor = createEditor(container)

    await process(ast, cytoscapeAdapter(editor))
    console.log(editor.nodes().map(n => n.data()))
    await layout(editor)

    tabs.insert({ name, editor })

    return name
  }
  async function openScope(name: string) {
    current.next(name)
  }
  openScope(await insertTab(tsAst))
}()
