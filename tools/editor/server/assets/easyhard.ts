
import { $, h } from 'easyhard'
import { Observable, combineLatest, map } from 'rxjs'

function add(props: { left: Observable<number>, right: Observable<number> }): Observable<number> {
  return combineLatest({ left: props.left, right: props.right }).pipe(map(arg => arg.left + arg.right))
}
function Input(p: any) {
  return h('div', p)
}


const a = $(1)
const b = $(0)
const sum = add({ left: a, right: b })

// eslint-disable-next-line functional/no-expression-statement
h('div', {},
  Input({ model: a }),
  ' + ',
  Input({ model: b }),
  ' = ',
  sum
)
