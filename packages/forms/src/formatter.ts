import { $ } from 'easyhard'
import { OperatorFunction, pipe } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { FormValue } from './types'

export type Formatter<T, K> = OperatorFunction<T, K>;
export type FormatterGroup<I> = { output: Formatter<I, string>, input: Formatter<string, I> };

export function toNumber(): Formatter<string | number, number> {
  return map(v => typeof v === 'string' ? parseFloat(v) || 0 : v)
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function clamp(min: number, max: number): Formatter<string | number, number> {
  return pipe(toNumber(), map((v: number) => Math.min(Math.max(v, min), max)))
}

export function min(min: number): Formatter<string | number, number> {
  return pipe(toNumber(), map((v: number) => Math.max(v, min)))
}

export function max(max: number): Formatter<string | number, number> {
  return pipe(toNumber(), map((v: number) => Math.min(v, max)))
}

export function useFormatter<T>(value: FormValue<T>, props: FormatterGroup<T>) {
  const v = $<string>(String(value.value))

  return {
    next(value: string) { v.next(value) },
    value: value.pipe(props.output),
    injection: v.pipe(props.input, tap(v => value.next(v)))
  }
}
