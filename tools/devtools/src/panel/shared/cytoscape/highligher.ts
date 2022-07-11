import cytoscape from 'cytoscape'
import { getCytoscapeCanvas } from './canvas'

type Rect = { x: number, y: number, width: number, height: number }

export type AreaHighligher = { highlight(rect: Rect): void, hide(): void }

export function createAreaHighlighter(cy: cytoscape.Core): AreaHighligher {
  const { context, reset } = getCytoscapeCanvas(cy, { zIndex: 0 })

  if (!context) throw new Error('nor context')

  let area: null | Rect = null

  cy.on('render cyCanvas.resize', () => {
    reset()
    if (!area) return

    const { x, y, width, height } = area
    const d = 10000

    context.fillStyle = 'rgba(0,0,0,0.4)'
    context.fillRect(x - d, y - d, d * 2, d * 2)
    context.clearRect(x - width / 2, y - height / 2, width, height)
  })

  return {
    highlight(rect: Rect) {
      area = rect
      cy.forceRender()
    },
    hide() {
      area = null
      cy.forceRender()
    }
  }
}
