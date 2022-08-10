
import { $, h } from 'easyhard'

function add(a, b) {
  return 0// combineLatest(a, b).pipe(map(([a,b]) => a + b))
}
// function Input() {

// }


const a = $(1)
const b = $(0)
const sum = add(a, b)

return h('div', {},
  // Input({ model: a }),
  // ' + ',
  // Input({ model: b }),
  // ' = ',
  sum
)
