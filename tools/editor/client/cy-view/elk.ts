import { Core, NodeCollection } from 'cytoscape'
import ELK, { ElkNode } from 'elkjs'

const argumentOffset = 30

function getNodes(nodes: NodeCollection): ElkNode[] {
  return nodes.map(n => {
    const maxIndex = n.data('withPorts') ? Math.max(...n.children().map(n => n.data('index'))) : 0

    return <ElkNode>{
      id: n.data('id'),
      width: n.width(),
      height: n.height() + maxIndex * argumentOffset,
      labels: [{ "text": n.data('label') }],
      ...(n.data('withPorts') ? {
        ports: n.children().map((port) => {
          return {
            id: port.data('id'),
            width: port.width(),
            height: port.height(),
            labels: [{ "text": port.data('label') }],
            properties: {
              side: "WEST",
              index: maxIndex - +port.data('index') // fix an order because they are clock-wised
            }
          }
        }),
        properties: {
          "portConstraints": "FIXED_ORDER"
        }
      } : {
        children:  getNodes(n.children())
      })
    }
  })
}

function applyPositions(cy: Core, nodes?: ElkNode[], offset: { x: number, y: number } = { x: 0, y: 0 }) {
  nodes && nodes.forEach(n => {
    if (!n.x || !n.y) throw new Error('no position')
    const position = { x: n.x + offset.x, y: n.y + offset.y }
    const node = cy.getElementById(n.id)

    node.position(position)

    if (node.data('withPorts')) {
      node.children().forEach(child => {
        child.position({
          x: position.x,
          y: position.y + child.data('index') * argumentOffset
        })
      })
    }
    applyPositions(cy, n.children, position)
  })
}

const elk = new ELK()

export async function layoutELK(cy: Core, fit: boolean) {
  const layouted = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',

    },
    children: getNodes(cy.nodes().orphans()),
    edges: cy.edges().map(e => {
      return { id: e.data('id'), sources: [e.source().data('id')], targets: [e.target().data('id')]}
    })
  })
  console.log(JSON.stringify(layouted.children))
  console.log(JSON.stringify(layouted.edges))

  applyPositions(cy, layouted.children)

  if (fit) {
    cy.fit()
  }
}
