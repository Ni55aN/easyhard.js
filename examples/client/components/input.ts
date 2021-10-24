import { h, $, EventAttrs } from 'easyhard'
import { tap } from 'rxjs/operators'

type Props<T, Type> = {
  value?: $<T>;
  model?: $<T>;
  type?: Type,
  autofocus?: boolean;
  change?: (v: T) => void,
  events?: EventAttrs
};

export function Input(props: Props<number, 'number'> | Props<string, 'text'>): HTMLInputElement {
  const el = h('input', {
    value: props.value || props.model,
    type: props.type,
    input: tap((v: Event) => {
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
    }),
    ...(props.events || {})
  })
  if (props.autofocus) requestAnimationFrame(() => el.focus())

  return el
}
