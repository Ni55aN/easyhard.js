import { h, EventAttrs } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

const buttonStyles = css({
  right: '1em',
  top: '1em',
  zIndex: '1',
  background: '#86ac86',
  border: '0',
  borderRadius: '4px',
  padding: '0.2em 0.5em',
  cursor: 'pointer',
  margin: '1em 0.5em',
  color: 'white',
  ':first-child': {
    marginLeft: '1em'
  },
  ':last-child': {
    marginRight: '1em'
  },
  ':active': {
    background: '#669c66',
  }
})

export function ControlButton(props: { label: string, active?: Observable<boolean>, click: EventAttrs['click'] }) {
  return h('button', { click: props.click },
    injectStyles(buttonStyles),
    injectStyles({ background: props.active?.pipe(map(active => active ? '#468c46' : '')) }),
    props.label
  )
}
