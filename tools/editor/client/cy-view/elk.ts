import { CollectionData, Core, EdgeSingular, NodeCollection, NodeSingular } from 'cytoscape'
import ELK, { ElkNode, LayoutOptions } from 'elkjs'

const argumentOffset = 35

function getNodeArguments(node: NodeSingular) {
  return node.children().filter(n => n.data('type') === 'Argument')
}

function getPortId(node: CollectionData, index: number | 'out') {
  return ['port', node.data('id'), index].join('_')
}

function withIndex(item: CollectionData) {
  return Number.isFinite(item.data('index'))
}

function getNodes(nodes: NodeCollection): ElkNode[] {
  return nodes.map(n => {
    const argumentNodes = getNodeArguments(n)
    const edgesWithIndexes = n.incomers('edge').union(argumentNodes.incomers('edge'))
    if (!edgesWithIndexes.every(withIndex)) throw new Error('every edge should have index')
    const indexes = edgesWithIndexes.map(edge => edge.data('index'))
    const maxIndex = Math.max(0, ...indexes)

    return <ElkNode>{
      id: n.data('id'),
      width: n.width(),
      height: n.height() + maxIndex * argumentOffset,
      labels: [{ "text": n.data('label') }],
      ports: [
        ...edgesWithIndexes.map((edge: EdgeSingular) => {
          return {
            id: getPortId(edge, edge.data('index')),
            width: 10,
            height: 10,
            labels: [{ "text": edge.data('label') }],
            properties: {
              side: "WEST",
              index: maxIndex - +edge.data('index') // fix an order because they are clock-wised
            }
          }
        }),
        {
          id: getPortId(n, 'out'),
          width: 10,
          height: 10,
          properties: {
            side: "EAST",
            index: 0
          }
        }
      ],
      properties: {
        "portConstraints": "FIXED_ORDER"
      },
      children: getNodes(n.children().subtract(argumentNodes))
    }
  })
}

function applyPositions(cy: Core, nodes?: ElkNode[], offset: { x: number, y: number } = { x: 0, y: 0 }) {
  if (!nodes) return

  nodes.forEach(n => {
    if (n.x === undefined || n.y === undefined) throw new Error('no position')

    const position = { x: n.x + offset.x, y: n.y + offset.y }
    const node = cy.getElementById(n.id)

    node.position(position)

    const argumentNodes = getNodeArguments(node)
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
    const source = getPortId(e.source(), 'out')
    const target = getPortId(e, e.data('index'))

    return { id: e.data('id'), sources: [source], targets: [target]}
  })
  const layoutOptions: LayoutOptions = {
    'algorithm': 'layered',
    "hierarchyHandling": "INCLUDE_CHILDREN",
    'elk.layered.layering.strategy': 'MIN_WIDTH',
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    'spacing.nodeNodeBetweenLayers': '5',
    'spacing.edgeEdgeBetweenLayers': '5',
    'spacing.edgeNodeBetweenLayers': '5',
    'spacing.nodeNode': '25',
    'spacing.edgeEdge': '25',
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
