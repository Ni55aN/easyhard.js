import { CollectionData, Core, EdgeSingular, NodeCollection, NodeSingular } from 'cytoscape'
import ELK, { ElkNode, LayoutOptions } from 'elkjs'

const argumentOffset = 35

function getNodeArguments(node: NodeSingular) {
  return node.children().filter(n => n.data('type') === 'Argument')
}

function filterWithIndex(item: CollectionData) {
  return Number.isFinite(item.data('index'))
}

function getNodes(nodes: NodeCollection): ElkNode[] {
  return nodes.map(n => {
    const edgesWithIndexes = n.incomers('edge').union(
      getNodeArguments(n).incomers('edge')
    ).filter(filterWithIndex)
    const indexes = edgesWithIndexes.map(edge => edge.data('index'))
    const maxIndex = Math.max(0, ...indexes)

    return <ElkNode>{
      id: n.data('id'),
      width: n.width(),
      height: n.height() + maxIndex * argumentOffset,
      labels: [{ "text": n.data('label') }],
      ports: edgesWithIndexes.map((edge: EdgeSingular) => {
        return {
          id: ['port', edge.data('id'), edge.data('index')].join('_'),
          width: 10,
          height: 10,
          labels: [{ "text": edge.data('label') }],
          properties: {
            side: "WEST",
            index: maxIndex - +edge.data('index') // fix an order because they are clock-wised
          }
        }
      }),
      properties: {
        "portConstraints": "FIXED_ORDER"
      },
      children: getNodes(n.children().filter(n => n.data('type') !== 'Argument'))
    }
  })
}

function applyPositions(cy: Core, nodes?: ElkNode[], offset: { x: number, y: number } = { x: 0, y: 0 }) {
  nodes && nodes.forEach(n => {
    if (!n.x || !n.y) throw new Error('no position')
    const position = { x: n.x + offset.x, y: n.y + offset.y }
    const node = cy.getElementById(n.id)

    node.position(position)

    const argumentNodes = node.children().filter(n => n.data('type') === 'Argument')
    const minIndex = Math.min(...argumentNodes.map(n => n.data('index')))

    argumentNodes.forEach(child => {
      child.position({
        x: position.x,
        y: position.y + (child.data('index') - minIndex) * argumentOffset
      })
    })
    applyPositions(cy, n.children, position)
  })
}

const elk = new ELK()

export async function layoutELK(cy: Core, fit: boolean) {
  const children = getNodes(cy.nodes().orphans())
  const edges = cy.edges().map(e => {
    const source = e.source().data('id')
    const index = e.data('index')
    const target = Number.isFinite(index) ? ['port', e.data('id'), index].join('_') : e.target().data('id')

    return { id: e.data('id'), sources: [source], targets: [target]}
  })
  const layoutOptions: LayoutOptions = {
    'algorithm': 'layered',
    'elk.layered.layering.strategy': 'STRETCH_WIDTH',
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    'spacing.nodeNodeBetweenLayers': '5',
    'spacing.edgeEdgeBetweenLayers': '5',
    'spacing.edgeNodeBetweenLayers': '5',
    'spacing.nodeNode': '15',
    'spacing.edgeEdge': '15',
  }
  const args: ElkNode = {
    id: 'root',
    layoutOptions,
    children,
    edges
  }
  console.log(JSON.stringify(args, null, ' '))
  const layouted = await elk.layout(args)

  applyPositions(cy, layouted.children)

  if (fit) {
    cy.fit()
  }
}
