import { h, $, $$, $for } from 'easyhard'
import { Observable, pipe } from 'rxjs'
import { tap, switchMap, map } from 'rxjs/operators'
import { FieldInput } from './types'

export type SelectOption = Observable<{ key: string; label: $<string> } | null>;

export function Select<T>(options: $$<SelectOption>): FieldInput<T> {
  return (value, params) => {
    return h('select', {
      change: tap((e: Event) => value.next((e.target as HTMLSelectElement).value as unknown as T)),
      ...params
    },
    $for(options, pipe(switchMap(option => option), map(option => option &&
        h('option', { value: option.key }, option.label)
    ))
    )
    )
  }
}
