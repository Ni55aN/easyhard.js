import { h } from 'easyhard'
import { tap } from 'rxjs/operators'
import { FieldInput } from './types'

export function Checkbox(): FieldInput<boolean> {
  return (checked, params) => {
    return h('input', {
      type: 'checkbox',
      checked,
      change: tap((e: Event) => checked.next((e.target as HTMLInputElement).checked)),
      ...params
    })
  }
}
