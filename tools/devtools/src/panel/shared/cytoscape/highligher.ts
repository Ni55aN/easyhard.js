import cytoscape from 'cytoscape'
import cyCanvas from 'cytoscape-canvas'

cyCanvas(cytoscape)

type Rect = { x: number, y: number, width: number, height: number }

export type AreaHighligher = { highlight(rect: Rect): void, hide(): void }

export function createAreaHighlighter(cy: cytoscape.Core): AreaHighligher {
  const layer = (cy as any).cyCanvas()
  const canvas: HTMLCanvasElement = layer.getCanvas()
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('nor context')

  let area: null | Rect = null

  cy.on('render cyCanvas.resize', () => {
    layer.resetTransform(ctx)
    layer.clear(ctx)
    layer.setTransform(ctx)

    if (!area) return

    const { x, y, width, height } = area
    const d = 10000

    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(x - d, y - d, d * 2, d * 2)
    ctx.clearRect(x - width / 2, y - height / 2, width, height)
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
