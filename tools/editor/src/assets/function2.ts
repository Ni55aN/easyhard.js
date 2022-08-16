
function a(num: number) {
  const n1 = 1
  const n2 = 1

  return num > 0 ? n1 : n2
}
// eslint-disable-next-line no-unused-vars
function b(num: number) {
  return num
}
// eslint-disable-next-line no-unused-vars
function c(num: number) {
  return num
}

// eslint-disable-next-line no-unused-vars
const d = a(b(c(3)))

export {};
