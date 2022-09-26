import cytoscape, { Core, NodeCollection } from 'cytoscape'
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
    match<ID extends string | number | undefined>(elements: {
      // eslint-disable-next-line @typescript-eslint/ban-types
      nodes: Array<(ID extends undefined ? {} : { id: ID, parent?: ID }) & Record<string, unknown>>,
      edges?: Array<{ source: Exclude<ID, undefined>, target: Exclude<ID, undefined> } & Record<string, unknown>>
    }) {
      const nodeMatches = elements.nodes.map(({ id, parent, ...data }) => {
        const match = _.matches(data)

        return {
          id,
          parent,
          data,
          matches: graph.nodes().filter(n => match(n.data())) as NodeCollection
        }
      })

      nodeMatches.forEach(match => {
        if (match.matches.length === 0) throw new Error(`not found node for ${JSON.stringify(match.data)}`)
        // TODO not safe when found multiple matches
      })
      if (elements.nodes.length !== graph.nodes().length) throw new Error('number of nodes is not equal')
      if ((elements.edges?.length || 0) !== graph.edges().length) throw new Error('number of edges is not equal')
      nodeMatches.filter(match => match.parent).forEach(match => {
        const nodes = match.matches
        const realParentIds = nodes.map(n => n.parent().data('id'))
        const parent = nodeMatches.find(n => n.id === match.parent)

        if (!parent) throw new Error(`parent node ${match.parent} does not exist`)
        if (_.intersection(realParentIds, parent.matches.map(n => n.data('id'))).length !== 1) throw new Error(`${match.parent} is not parent for ${match.id}`)
      })

      if (!elements.edges) return

      const edgesMatches = elements.edges.map(data => {
        const realSource = nodeMatches.find(n => n.id === data.source)?.matches
        const realTarget = nodeMatches.find(n => n.id === data.target)?.matches

        if (!realSource) throw new Error(`cannot find source for ${JSON.stringify(data)}`)
        if (!realTarget) throw new Error(`cannot find target for ${JSON.stringify(data)}`)

        const match = realSource.map(source => realTarget.map(target => _.matches({ ...data, source: source.id(), target: target.id() }))).flat()

        return {
          data,
          matches: graph.edges().filter(edge => match.some(m => m(edge.data())))
        }
      })
      edgesMatches.forEach(match => {
        if (match.matches.length === 0) throw new Error(`not found edge for ${JSON.stringify(match.data)}`)
      })
    },
    toHaveNode<T extends Record<string, unknown>>(data: T) {
      const match = _.matches(data)
      const has = graph.nodes().filter(n => match(n.data())).length > 0

      if (!has) throw new Error(`cannot find node with data ${JSON.stringify(data)}`)
    }
  }
}
