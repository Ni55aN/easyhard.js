import { Observable as Ob, map, of, tap, pipe } from 'rxjs'
import { console, String, Number } from 'easyhard-browser-builtins'

type R = () => number
type N = number | string | Ob<number>

const subject1 = of<N>(35)
const subject2 = of<N>('45')
function double(v: N | R) { return v === 0 ? '0' : String(Number(v) * 2)}
const m = pipe(map<N, string>(double), tap(() => double(1)))

const ob1 = m(subject1)
const ob2 = m(subject2)

// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
ob1.subscribe(console.log)
// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
ob2.subscribe(console.log)
