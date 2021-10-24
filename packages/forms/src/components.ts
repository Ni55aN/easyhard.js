import { h, $$, $for } from 'easyhard'
import { pipe } from 'rxjs'
import { tap, switchMap, map } from 'rxjs/operators'
import { InputParams, SelectOption } from 'src'
import { useFormatter } from './formatter'
import { FormValue } from './types'

export function Checkbox(checked: FormValue<boolean>, params: InputParams<boolean>) {
  return h('input', {
    type: 'checkbox',
    checked,
    change: tap((e: Event) => checked.next((e.target as HTMLInputElement).checked)),
    ...params
  })
}

export function Select<T>(options: $$<SelectOption>) {
  return (value: FormValue<T>, params: InputParams<string>) => {
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

export function Textbox(value: FormValue<string>, params: InputParams<string>) {
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


export function Numbox(value: FormValue<number>, params: InputParams<number>) {
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
