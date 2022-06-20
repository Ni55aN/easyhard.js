import { h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'

const scontainerStyles = css({
  width: '100%',
  height: '100%',
  overflow: 'hidden'
})

export function Main(props: { styles?: RootStyleDeclaration }) {
  return h('div', {}, injectStyles(scontainerStyles), props.styles ? injectStyles(props.styles) : null)
}
