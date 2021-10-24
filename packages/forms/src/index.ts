import { h, $ } from 'easyhard'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { FormatterGroup } from './formatter'
import { Group } from './types'

export type SelectOption = Observable<{ key: string; label: $<string> } | null>;
export type InputParams<T> = { disabled?: boolean | Observable<boolean>, formatters?: { input?: FormatterGroup<T>['input']; output?: FormatterGroup<T>['output'] } };
export type FieldInput<T> = (v: $<T>, params: InputParams<T>) => HTMLElement;

export function Field<T>(label: string | Observable<string>, value: $<T>, props: { type: FieldInput<T>, validations?: Observable<(string | boolean)[]> } & InputParams<T>) {
  const { type, validations, ...params } = props

  return h('p', {},
    h('div', {}, label),
    type(value, params),
    validations ? validations.pipe(map(validation =>
      h('div', { style: 'color: red' }, validation.map(result => h('div', {}, result === true ? null : result)))
    )) : null
  )
}

export function useForm<T extends Group>(form: T) {
  return {
    form
  }
}

export * from './types'
export * as validation from './validation'
export * as formatter from './formatter'
export * as components from './components'
