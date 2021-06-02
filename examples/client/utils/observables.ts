import { combineLatest, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export const not = map(v => !v)

export function interpolate(strings: TemplateStringsArray, ...args: Observable<string>[]): Observable<string> {
  return combineLatest(args).pipe(map(values =>
    strings.map((s, i) => ([s, values[i]].filter(v => v))).reduce((acc, v) => [...acc, ...v], []).join('')
  ))
}
