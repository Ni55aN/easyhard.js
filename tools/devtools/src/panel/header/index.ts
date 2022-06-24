import { Child, EventHandler, h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'

const styles = css({
  width: '100%',
  height: '100%',
  borderBottom: '1px solid grey',
  display: 'flex'
})

export function Header(props: { click?: EventHandler<'click'>, styles?: RootStyleDeclaration, content: { left?: Child, center?: Child, right?: Child } }) {

  return h('div', { click: props.click } , injectStyles(styles), props.styles && injectStyles(props.styles),
    props.content.left || null,
    h('div', {}, injectStyles({ flex: 1 }), props.content.center || null),
    props.content.right || null
  )
}
