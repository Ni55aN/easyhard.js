import { h, $ } from 'easyhard';
import { pipe, UnaryFunction } from 'rxjs';


type Props<T> = {
  value?: $<T>; 
  model?: $<T>;
  type?: 'number' | 'text',
  autofocus?: boolean;
  change?: (v: string) => void,
  events?: {[key: string]: Function}
};

export function Input<T>(props: Props<T>) {
    const el = h('input', {
      value: props.value || props.model,
      type: props.type,
      input: (v: Event) => {
        let val = (v.target as any).value;

        if (props.type === 'number') val = +val;
        if (props.model) props.model.next(val);
        if (props.change) props.change(val);
      },
      ...(props.events || {})
    });
    if (props.autofocus) requestAnimationFrame(() => el.focus());

    return el;
}