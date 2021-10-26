import { h, $, Child } from 'easyhard'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { FieldInput, InputParams } from './types'

export interface FieldParams<T> extends InputParams<T>  {
  type: FieldInput<T>
  validations?: Observable<(string | boolean)[]>
}

export function Field<T>(label: string | Observable<string>, value: $<T>, props: FieldParams<T>): Child {
  const { type, validations, ...params } = props

  return h('p', {},
    h('div', {}, label),
    type(value, params),
    validations ? validations.pipe(map(validation =>
      h('div', { style: 'color: red' }, validation.map(result => h('div', {}, result === true ? null : result)))
    )) : null
  )
}
