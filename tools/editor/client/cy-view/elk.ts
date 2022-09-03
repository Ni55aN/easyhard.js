import { Core, NodeCollection } from 'cytoscape'
import ELK, { ElkNode } from 'elkjs'

function getNodes(nodes: NodeCollection): { id: string }[] {
  return nodes.map(n => {
    return {
      id: n.data('id'),
      width: n.width(),
      height: n.height(),
      children: getNodes(n.children())
    }
  })
}

function applyPositions(cy: Core, nodes?: ElkNode[], offset: { x: number, y: number } = { x: 0, y: 0 }) {
  nodes && nodes.forEach(n => {
    if (!n.x || !n.y) throw new Error('no position')
    const position = { x: n.x + offset.x, y: n.y + offset.y }

    cy.getElementById(n.id).position(position)
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
