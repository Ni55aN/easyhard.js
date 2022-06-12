import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Child } from '../types'

export function $if(state: Observable<boolean>, then: () => Child, another?: () => Child): Observable<Child> {
  return state.pipe(
    map(v => {
      if (v) return then()
      if (another) return another()
      return null
    })
  )
}
