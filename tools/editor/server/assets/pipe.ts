import { console, Boolean } from 'easyhard-browser-builtins'
import { of } from 'rxjs'
import { filter, mapTo } from 'rxjs/operators'

const f = (v: number) => Boolean(v + v)

// eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/unbound-method
of(5).pipe(mapTo(45)).pipe(filter(f)).subscribe(console.log)
