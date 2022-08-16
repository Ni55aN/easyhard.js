import { map, of } from 'rxjs'
import { console } from 'builtins'

const subject = of<number>(45)
function double(v: number) { return v * 2}
const m = map<number, number>(double)

const ob1 = subject.pipe(m)
const ob2 = subject.pipe(m)

// eslint-disable-next-line @typescript-eslint/unbound-method
const log = console.log
// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
ob1.subscribe(log)
// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
ob2.subscribe(log)
