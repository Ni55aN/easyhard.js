import { Child, h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'

const sidebarStyles = css({
  width: '100%',
  height: '100%'
})

export function Sidebar(props: { styles?: RootStyleDeclaration }, ...children: Child[]) {
  return h('div', {}, injectStyles(sidebarStyles), props.styles ? injectStyles(props.styles) : null,
    ...children
  )
}
