import { h, $, EventAttrs } from 'easyhard'
import { MonoTypeOperatorFunction, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

type Props<T, Type> = {
  value?: $<T>;
  model?: $<T>;
  type?: Type,
  autofocus?: boolean;
  change?: (v: T) => void,
  events?: EventAttrs
};

type Tap = <T>(
  next?: ((value: T) => void) | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: ((error: any) => void) | null,
  complete?: (() => void) | null,
  parent?: Observable<unknown>
) => MonoTypeOperatorFunction<T>

export function Input(props: Props<number, 'number'> | Props<string, 'text'>): HTMLInputElement {
  const el = h('input', {
    value: props.value || props.model,
    type: props.type,
    input: (tap as Tap)((v: Event) => {
      const value = (v.target as HTMLInputElement).value
      if (props.type === 'number') {
        if (props.model) props.model.next(+value)
        if (props.change) props.change(+value)
      } else if (props.type === 'text') {
        if (props.model) props.model.next(value)
        if (props.change) props.change(value)
      } else {
        throw new Error('unknown type')
      }
    }, null, null, props.model),
    ...(props.events || {})
  })
  if (props.autofocus) requestAnimationFrame(() => el.focus())

  return el
}
