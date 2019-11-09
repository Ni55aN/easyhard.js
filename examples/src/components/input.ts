import { h, $ } from 'easyhard';

export function Input(props: { value?: $<any>; model?: $<any>; type?: 'number' | 'text', change?: (v: string) => void }) {
    return h('input', {
      value: props.value || props.model,
      input: (v: Event) => {
        let val = (v.target as any).value;
        if (props.type === 'number') val = +val;
      
        if (props.model) props.model.next(val);
        if (props.change) props.change(val);
      }
    });
  }