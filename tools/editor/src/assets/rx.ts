import { map, of } from 'rxjs'
import { console } from 'builtins'

const subject = of<number>(45)

const m = map<number, number>(v => v * 2)

const ob1 = subject.pipe(m)
const ob2 = subject.pipe(m)

// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
ob1.subscribe(console.log)
// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
ob2.subscribe(console.log)
