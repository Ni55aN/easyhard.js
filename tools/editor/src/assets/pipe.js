import { console, Boolean } from 'builtins'
import { of } from 'rxjs'
import { filter, mapTo } from 'rxjs/operators'

const f = v => Boolean(v + v)

of(5).pipe(mapTo(45), filter(f)).subscribe(console.log)
