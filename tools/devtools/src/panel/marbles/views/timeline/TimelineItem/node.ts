import { h } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'

const nodeStyles = css({
  padding: '1em',
  display: 'inline-block',
  fontSize: '12px',
  background: '#f1c82a',
  border: '2.3px solid black',
  borderRadius: '13px',
  color: 'white',
  width: '65px',
  height: '20px',
  textAlign: 'center',
  verticalAlign: 'middle',
  margin: '0.5em',
  boxSizing: 'border-box'
})

export function Node(props: { id: string, height: number, width: number, margin: number }) {
  return h('div', {},
    injectStyles(nodeStyles),
    injectStyles({ height: `${props.height}px`, width: `${props.width}px`, margin: `${props.margin}px` }),
    props.id
  )
}
