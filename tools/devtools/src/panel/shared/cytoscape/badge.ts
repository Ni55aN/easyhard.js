import cytoscape from 'cytoscape'
import { getCytoscapeCanvas } from './canvas'

export function createNodesBadge(cy: cytoscape.Core, getNodes: () => cytoscape.CollectionReturnValue, content: (node: cytoscape.NodeSingular) => string | false) {
  const { context, reset } = getCytoscapeCanvas(cy, { zIndex: 0 })

  if (!context) throw new Error('context is not valid')

  cy.on('render cyCanvas.resize', () => {
    reset()

    getNodes().forEach(node => {
      const value = content(node)
      if (!value) return
      const { x, y } = node.position()
      const position = {
        x: x + node.width() / 2,
        y: y - node.height() / 2
      }
      const size = 5
      const fontSize = 5

      context.fillStyle = 'grey'
      context.beginPath()
      context.arc(position.x, position.y, size, 0, 2 * Math.PI)
      context.fill()

      context.font = `${fontSize}px sans-serif`
      context.textBaseline = 'middle'
      context.fillStyle = 'white'
      context.textAlign = 'center'
      context.fillText(value, position.x, position.y)
    })
  })
}
