function a(num: number) {
  return num > 0 ? 1 : 2
}
// eslint-disable-next-line no-unused-vars
function b(num: number) {
  return 1
}
// eslint-disable-next-line no-unused-vars
function c(num: string) {
  return 1
}

// eslint-disable-next-line no-unused-vars
const d = a(b(c('abc')))

export {};
