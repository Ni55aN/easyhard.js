import { h, Child } from 'easyhard'

// @hmr
export function HMR<T extends Child>(value: T): HTMLElement {
  return h('div', {}, '-s-', value)
}
