import { $, $$, $for, h } from 'easyhard'
import { map, tap } from 'rxjs/operators'
import { injectStyles } from 'easyhard-styles'
import neo4j, { Node } from 'neo4j-driver'
import { parse } from 'recast/parsers/typescript'
import { Node as ASTNode } from '@babel/types'
import { createEditor, layout } from './cy-view'
import { process } from './transpiler'
import source from './assets/easyhard?raw'
import cytoscape from 'cytoscape'
import { cytoscapeAdapter } from './cy-view/adapter'
import { neo4jAdapter, neo4jSimplify, getNodes, clear } from './neo4j-view'

const tsAst = parse(source)

console.log('Source', source)
console.log('Root', tsAst.program.body)

void async function () {
  const driver = neo4j.driver(
    'neo4j://localhost',
    neo4j.auth.basic('neo4j', 'test') // TODO envs
  )

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

    await clear(driver)
    await process(ast, neo4jAdapter(driver))
    await neo4jSimplify(driver)

    await new Promise(res => setTimeout(res, 500))
    const data = await getNodes(driver)

    // const cyAdapter = cytoscapeAdapter(editor)
    // await process(ast, cyAdapter)

    const cyData = data.map(v => {
      if (v instanceof Node) {
        return { group: 'nodes' as const, data: {
          id: v.identity.toString(),
          labels: v.labels,
          ...v.properties
        }}
      }
      return {
        group: 'edges' as const,
        data: {
          id: `edge_${v.identity.toString()}`,
          ...v.properties,
          type: v.type,
          source: v.start.toString(),
          target: v.end.toString()
        }
      }
    })
    editor.add(cyData)

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
