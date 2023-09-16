import cytoscape from 'cytoscape'

export function scaleGraph(cy: cytoscape.Core, axis: 'x' | 'y') {
  let prevZoom = cy.zoom()

  function getCoefficient(zoom: number, prevZoom: number) {
    const zoomIn = zoom > prevZoom
    const delta = Math.abs(zoom - prevZoom) * 3

    return zoomIn ? 1 + delta : 1 / (1 + delta)
  }

  return {
    getCoefficient,
    apply(zoom: number, screenOffset: number) {
      const pan = cy.pan()
      const k = getCoefficient(zoom, prevZoom)

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
