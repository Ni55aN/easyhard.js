import { h, $ } from 'easyhard';

type Props = {
  value?: $<any>; 
  model?: $<any>;
  type?: 'number' | 'text',
  autofocus?: boolean;
  change?: (v: string) => void,
  events?: {[key: string]: Function}
};

export function Input(props: Props) {
    const el = h('input', {
      value: props.value || props.model,
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