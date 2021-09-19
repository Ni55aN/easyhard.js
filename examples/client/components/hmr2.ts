import { h, Child } from 'easyhard'

// @hmr
export function HMR2<T extends Child>(value: T): HTMLElement {
  return h('div', {}, '-bsssss-', value)
}
