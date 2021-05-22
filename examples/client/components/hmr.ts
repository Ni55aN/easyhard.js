import { h, Child } from 'easyhard'

// @hmr
export function HMR<T extends Child>(value: T) {
  return h('div', {}, '-s-', value)
}
