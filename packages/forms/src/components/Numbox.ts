import { h } from 'easyhard'
import { tap, map } from 'rxjs/operators'
import { useFormatter } from '../formatter'
import { FieldInput } from './types'

export function Numbox(): FieldInput<number> {
  return (value, params) => {
    const { next, injection, value: formattedValue } = useFormatter(value, {
      input: params.formatters && params.formatters.input || map(v => parseFloat(v) || 0),
      output: params.formatters && params.formatters.output || map(v => String(v))
    })

    return h('input', {
      value: formattedValue,
      input: tap((e: Event) => {
        next((e.target as HTMLInputElement).value)
      }),
      ...params
    },
    injection
    )
  }
}
