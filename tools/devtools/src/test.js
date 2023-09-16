const  { vec2, mat3 } = require('gl-matrix')


const start = vec2.fromValues(0, 0)
const end = vec2.fromValues(-3, -3)

const vector = vec2.sub(vec2.create(), end, start)
const dist = vec2.distance(vec2.create(), vector)
const angle = -vec2.angle([1,0], vector)

const scale = mat3.scale(mat3.create(), mat3.create(), [dist, 1])
const rotate = mat3.rotate(mat3.create(), mat3.create(), angle)
const translate = mat3.translate(mat3.create(), mat3.create(), start)

const initialVector = vec2.fromValues(0.5, 0)

///
// const scaledVector = vec2.transformMat3(vec2.create(), initialVector, scale)
// const rotatedVector = vec2.rotate(vec2.create(), scaledVector, [0,0], angle)
// const translatedVector = vec2.add(vec2.create(), start, rotatedVector)

// const scaledVector2 = vec2.transformMat3(vec2.create(), initialVector, scale)
// const rotatedVector2 = vec2.transformMat3(vec2.create(), scaledVector2, rotate)
// const translatedVector2 = vec2.transformMat3(vec2.create(), rotatedVector2, translate)

///

const transform = mat3.mul(mat3.create(), translate, mat3.mul(mat3.create(), rotate, scale))

const transformedVector = vec2.transformMat3(vec2.create(), initialVector, transform)

const transformInvert = mat3.invert(mat3.create, transform)

const restoredVector = vec2.transformMat3(vec2.create(), transformedVector, transformInvert)


const n = toLocalCoordinates(start, end, [-1.5,-1.5])

console.log(translatedVector, restoredVector)


// convert the point in global coordinates into local edge coordinates
function toLocalCoordinates(start, end, point) {
  const vector = vec2.sub(vec2.create(), end, start)
  const dist = vec2.distance(vec2.create(), vector)
  const angle = -vec2.angle([1,0], vector)

  const scale = mat3.scale(mat3.create(), mat3.create(), [dist, 1])
  const rotate = mat3.rotate(mat3.create(), mat3.create(), angle)
  const translate = mat3.translate(mat3.create(), mat3.create(), start)

  const transform = mat3.mul(mat3.create(), translate, mat3.mul(mat3.create(), rotate, scale))
  const transformInvert = mat3.invert(mat3.create, transform)

  return vec2.transformMat3(vec2.create(), point, transformInvert)
}

