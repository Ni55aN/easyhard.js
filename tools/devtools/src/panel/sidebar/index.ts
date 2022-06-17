import { h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'

const sidebarStyles = css({
  background: 'red',
  width: '100%',
  height: '100%'
})

export function Sidebar(props: { styles?: RootStyleDeclaration }) {
  return h('div', {}, injectStyles(sidebarStyles), props.styles && injectStyles(props.styles), 'Sidebar')
}
