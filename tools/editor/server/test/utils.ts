import cytoscape, { Core } from 'cytoscape'
import _ from 'lodash'
import { join } from 'path'
import { cytoscapeWriter } from '../cy-view/adapter'
import { CodeTranspiler, GraphTranpiler } from '../transpiler'

export async function fixtureToGraph(name: string) {
  const file = join(__dirname, 'fixtures', `${name}.ts`)
  const transpiler = new CodeTranspiler(file)

  const cy = cytoscape()
  await transpiler.toGraph(cytoscapeWriter(cy))

  return cy
}

export async function graphToCode(graph: Core) {
  const transpiler = new GraphTranpiler()

  return transpiler.print(await transpiler.toSourceFile(graph))
}


export function expectGraph(graph: Core) {
  return {
    toHaveNode<T extends Record<string, unknown>>(data: T) {
      const match = _.matches(data)
      const has = graph.nodes().filter(n => match(n.data())).length > 0

      if (!has) throw new Error(`cannot find node with data ${JSON.stringify(data)}`)
    },
  }
}
