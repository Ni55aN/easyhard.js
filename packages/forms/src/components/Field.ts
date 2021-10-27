import { h, $, DomElement } from 'easyhard'
import { Observable, of, OperatorFunction } from 'rxjs'
import { map, mapTo } from 'rxjs/operators'
import { FieldInput, InputParams } from './types'

export interface FieldParams<T> extends InputParams<T>  {
  type: FieldInput<T>
  validations?: Observable<(string | boolean)[]>
  init?: OperatorFunction<ReturnType<FieldInput<T>>, unknown>
}

export function Field<T>(label: string | Observable<string>, value: $<T>, props: FieldParams<T>): DomElement {
  const { type, validations, init, ...params } = props
  const element = type(value, params)

  return h('p', {},
    h('div', {}, label),
    element,
    init && of(element).pipe(init, mapTo(null)),
    validations ? validations.pipe(map(validation =>
      h('div', { style: 'color: red' }, validation.map(result => h('div', {}, result === true ? null : result)))
    )) : null
  )
}
