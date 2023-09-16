
import { $, h, TagName } from 'easyhard'
import { Observable, combineLatest, map } from 'rxjs'
import { as } from 'easyhard-browser-builtins'

function add(props: { left: Observable<number>, right: Observable<number> }): Observable<number> {
  return map(function(arg: { left: number, right: number }) { return arg.left + arg.right })(combineLatest(props))
}
function Input(p: { model: Observable<number> }) {
  return h('div', {}, p.model)
}
const a = $(1)
const b = $(0)
const n = {
  add: add
}
const sum = n.add({ left: a, right: b })

const tag = as<TagName>('sp' + 'an')

// eslint-disable-next-line functional/no-expression-statement
h(tag, { style: 'color: red' },
  Input({ model: a }),
  ' + ',
  Input({ model: b }),
  ' = ',
  sum
)

// eslint-disable-next-line functional/no-return-void
// function a() {
//   // const f = 3
//   // function b() {
//   //   b()
//   // }
//   // a()
//   // return f
//   return 1
// }

// const nnn = function nnn() {
//   const n = 34
//   a()
//   nnn()
//   const i = 314
//   return a()
// }

// // nnn()


// const a = function (){
//   b()
// }

// a()
// function b() {
//   a()
// }
