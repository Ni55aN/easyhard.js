import cytoscape from 'cytoscape'

export function scaleGraph(cy: cytoscape.Core, axis: 'x' | 'y') {
  let prevZoom = cy.zoom()

  return {
    apply(zoom: number, screenOffset: number) {
      const pan = cy.pan()
      const zoomIn = zoom > prevZoom
      const delta = Math.abs(zoom - prevZoom) * 3
      const k = zoomIn ? 1 + delta : 1 / (1 + delta)

      cy.nodes().not(':parent').forEach(node => {
        node.position(axis, node.position(axis) * k || 0)
      })

      cy.pan({
        x: pan.x,
        y: pan.y,
        [axis]: screenOffset - ((screenOffset - pan[axis]) * k)
      })
      prevZoom = zoom
    }
  }
}
