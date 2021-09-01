import { Attrs, Child, h } from 'easyhard'

export function Input(attrs: Attrs<'input'> & { autofocus?: boolean }, ...children: Child[]): HTMLElement {
  const el = h('input', attrs, ...children)

  if (attrs.autofocus) requestAnimationFrame(() => el.focus())

  return el
}
