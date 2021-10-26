import { h } from 'easyhard'
import { pipe } from 'rxjs'
import { tap } from 'rxjs/operators'
import { useFormatter } from '../formatter'
import { FieldInput } from './types'

export const Textbox: FieldInput<string> = (value, params) => {
  const { next, injection, value: formattedValue } = useFormatter(value, {
    input: params.formatters && params.formatters.input || pipe(),
    output: params.formatters && params.formatters.output || pipe()
  })
  return h('input', {
    value: formattedValue,
    input: tap((e: Event) => {
      next((e.target as HTMLInputElement).value)
    }),
    ...params,
  },
  injection
  )
}
