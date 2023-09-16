import { console, Boolean } from 'easyhard-browser-builtins'
import { of } from 'rxjs'
import { filter, mapTo } from 'rxjs/operators'

const f = (v: number) => Boolean(v + v)

// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
filter(f)(filter(f)(mapTo(45)(of(5)))).subscribe(console.log)
