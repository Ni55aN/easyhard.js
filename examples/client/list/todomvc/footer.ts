import { h } from 'easyhard'

export function Footer(): HTMLElement {
  return (
    h('footer', { className: 'info' },
      h('p', {}, 'Double-click to edit a todo'),
      h('p', {},
        'Created by ', h('a', { href: 'http://github.com/ni55an/' }, 'ni55an')
      )
    )
  )
}
