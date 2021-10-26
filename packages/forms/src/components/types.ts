import { Observable } from 'rxjs'
import { FormValue } from '../types'
import { FormatterGroup } from '../formatter'

export interface InputParams<T> {
  disabled?: boolean | Observable<boolean>
  formatters?: {
    input?: FormatterGroup<T>['input']
    output?: FormatterGroup<T>['output']
  }
}

export type FieldInput<T> = (v: FormValue<T>, params: InputParams<T>) => HTMLElement;
