import { h } from 'easyhard'
import { css, injectStyles, RootStyleDeclaration } from 'easyhard-styles'

const arrowStyles = css({
  width: '100%',
  height: '3px',
  background: 'black'
})

const arrowheadStyles = css({
  transform: 'rotate(-45deg)',
  borderRightWidth: '4',
  borderBottomWidth: '4',
  width: '10px',
  height: '10px',
  position: 'absolute',
  right: '0',
  border: '2px solid black',
  borderLeftWidth: '0',
  borderTopWidth: '0',
  transformOrigin: '0% 50%'
})


export function Arrow(props: { styles: RootStyleDeclaration }) {
  return h('div', {}, injectStyles(arrowStyles), injectStyles(props.styles),
    h('div', {}, injectStyles(arrowheadStyles))
  )
}
