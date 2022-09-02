import { console } from 'easyhard-browser-builtins'

const j = 4
const q = 7

function a(arg: number): number {
  const l = 5
  return l + j * q + arg
}

const ss = 23
const dd = a(ss)

// eslint-disable-next-line functional/no-expression-statement
console.log(dd)


