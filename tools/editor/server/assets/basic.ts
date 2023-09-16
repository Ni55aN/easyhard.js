// import { console } from 'easyhard-browser-builtins'

// function a(arg: number) {
//   const k = 888
//   const m = 3 - k
//   const t = 34 / k

//   return arg + t - m
// }

// const k = 41
// const l = k + 4 + 5 + a(k)

// // eslint-disable-next-line functional/no-expression-statement
// console.log(k + l, l)

// type T = <M>() => M

// function a<M>(a: M) {
//   return 1
// }


// type T<M> = M | string & M
// type T1<M> = (a: M) => M | number
// type T2 = <M>(a: M) => M | number


let n = 0

function f() {
  return n + 1
}

const a = f()
const b = f() * 2 - a
f()
f()
const c = b * f()


//////

let n = 0

function f() {
  return ++n
}
