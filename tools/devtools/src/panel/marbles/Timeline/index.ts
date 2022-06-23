import { $$, $for, h } from 'easyhard'
import { css, injectStyles } from 'easyhard-styles'
import { combineLatest, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import stringify from 'fast-safe-stringify'
import { marbleSize, nodeMargin, nodeSize } from '../consts'
import { TableItem } from '../table'
import { Arrow } from './arrow'
import { Node } from './node'

const stickyLeftBlockStyles = css({
  position: 'sticky',
  left: 0,
  background: 'linear-gradient(90deg, white 0%, white 90%, transparent 100%)',
  display: 'inline-block',
  zIndex: '1'
})

const timelineContainerStyles = css({
  whiteSpace: 'nowrap',
  display: 'inline-block'
})

const timelineStyles = css({
  padding: '1em',
  display: 'inline-block',
  color: 'white',
  position: 'relative',
  height: '35px',
  verticalAlign: 'middle',
  paddingRight: marbleSize
})

const timelineItemStyles = css({
  padding: '1em',
  borderRadius: '30px',
  fontSize: '12px',
  background: 'grey',
  border: '2px solid black',
  color: 'white',
  position: 'absolute',
  width: marbleSize,
  height: marbleSize,
  top: '5px',
  textAlign: 'center',
  lineHeight: '30px',
  transform: 'translate(-50%, 0)',
  overflow: 'hidden'
})

export function Timeline<T>(props: { id: string, scale: Observable<number>, now: Observable<number>, start: Observable<number>, data: $$<TableItem<T>> }) {
  const width = combineLatest([props.now, props.scale, props.start]).pipe(map(([now, scale, min]) => `${(now - min) * scale}px`))

  return h('div', {},
    injectStyles(timelineContainerStyles),
    h('div', {}, injectStyles(stickyLeftBlockStyles), injectStyles({ marginRight: `${nodeMargin}px` }),
      Node({ id: props.id, width: nodeSize * 0.8, height: nodeSize * 0.4, margin: nodeSize * 0.1 })
    ),
    h('div', {},
      injectStyles(timelineStyles),
      injectStyles({ width }),
      Arrow({ styles: css({ position: 'absolute', top: '50%' })}),
      $for(props.data, map(item => {
        const offset = combineLatest([props.scale, props.start]).pipe(map(([scale, min]) => `${(item.time - min) * scale}px`))

        return h('span', {},
          injectStyles(timelineItemStyles),
          injectStyles({ left: offset }),
          stringify(item.emission)
        )
      }))
    )
  )
}
