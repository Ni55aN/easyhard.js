import { h, Child } from 'easyhard';

// @hmr
export function HMR<T extends Child>(value: T) {
  return h('div', {}, '-a-', value);
}

// @hmr
export function HMR2<T extends Child>(value: T) {
  return h('div', {}, '-b-', value);
}
