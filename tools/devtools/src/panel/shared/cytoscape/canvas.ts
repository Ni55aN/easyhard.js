import cytoscape from 'cytoscape'
import cyCanvas from 'cytoscape-canvas'

cyCanvas(cytoscape)

export function getCytoscapeCanvas(cy: cytoscape.Core, options: { zIndex: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layer = (cy as any).cyCanvas(options)
  const canvas: HTMLCanvasElement = layer.getCanvas()
  const context = canvas.getContext('2d')

  return {
    context,
    reset() {
      layer.resetTransform(context)
      layer.clear(context)
      layer.setTransform(context)
    }
  }
}
