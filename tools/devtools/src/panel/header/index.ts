import { EventHandler, h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'

const styles = css({
  background: 'grey',
  width: '100%',
  height: '100%'
})

export function Header(props: { click?: EventHandler<'click'>, styles?: RootStyleDeclaration }) {
  return h('div', { click: props.click } , injectStyles(styles), props.styles && injectStyles(props.styles), 'Panel')
}
