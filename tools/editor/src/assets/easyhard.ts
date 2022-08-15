
import { $, h } from 'easyhard'
import { Observable, combineLatest, map } from 'rxjs'

function add({ left, right }: { left: Observable<number>, right: Observable<number> }): Observable<number> {
  return combineLatest(left, right).pipe(map(([a,b]) => a + b))
}
// function Input() {

// }


const a = $(1)
const b = $(0)
const sum = add({ left: a, right: b })

// eslint-disable-next-line functional/no-expression-statement
h('div', {},
  // Input({ model: a }),
  // ' + ',
  // Input({ model: b }),
  // ' = ',
  sum
)
