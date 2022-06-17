import { EdgeSingular } from 'cytoscape'
import { vec2, mat3 } from 'gl-matrix'

function toLocalCoordinates(start: vec2, end: vec2, point: vec2) {
  const vector = vec2.sub(vec2.create(), end, start)
  const dist = vec2.distance(vec2.create(), vector)
  const vectorsAngle = vec2.angle([1,0], vector)
  const angle = (end[1] > start[1] ? vectorsAngle - 2 * Math.PI : -vectorsAngle)

  const scale = mat3.scale(mat3.create(), mat3.create(), [dist, 1])
  const rotate = mat3.rotate(mat3.create(), mat3.create(), angle)
  const translate = mat3.translate(mat3.create(), mat3.create(), start)

  const transform = mat3.mul(mat3.create(), translate, mat3.mul(mat3.create(), rotate, scale))
  const transformInvert = mat3.invert(mat3.create(), transform)

  return vec2.transformMat3(vec2.create(), point, transformInvert)
}

export function adjustEdgeCurve(edge: EdgeSingular) {
  const sourcePosition = edge.source().position()
  const targetPosition = edge.target().position()

  const start = vec2.fromValues(sourcePosition.x, sourcePosition.y)
  const end = vec2.fromValues(targetPosition.x, targetPosition.y)

  const distanceX = Math.abs(start[0] - end[0])
  const alpha = 0.25
  const startControl = toLocalCoordinates(start, end, vec2.add(vec2.create(), start, [distanceX * alpha, 0]))
  const middle = toLocalCoordinates(start, end, vec2.div(vec2.create(), vec2.add(vec2.create(), start, end), [2,2]))
  const endControl = toLocalCoordinates(start, end, vec2.add(vec2.create(), end, [-distanceX * alpha, 0]))

  edge.style('control-point-weights', [startControl[0],  middle[0], endControl[0]])
  edge.style('control-point-distances', [startControl[1], middle[1], endControl[1]])
}
