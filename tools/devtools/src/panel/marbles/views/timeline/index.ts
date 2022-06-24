import { $, h } from 'easyhard'
import { injectStyles } from 'easyhard-styles'
import { combineLatest,  fromEvent, interval } from 'rxjs'
import { map, mapTo, shareReplay, tap } from 'rxjs/operators'
import { Button } from '../../../shared/Button'
import { Table } from '../../table'
import { scrollToRight, zoomArea } from '../../utils'
import { nodeSize, nodeMargin } from './consts'
import { TimelineArea } from './TimelineArea'

export function Timeline<T>(props: { table: Table<T>}) {
  const { table } = props
  const scale = $(0.05)
  const follow = $(false)
  const now = interval(200).pipe(map(() => Date.now())).pipe(shareReplay())
  const timelineArea = TimelineArea({ data: table, scale, now })

  return h('div', {}, injectStyles({ display: 'flex', flexDirection: 'column', maxHeight: '100%' }),
    h('div', {},
      Button({ label: 'Clear', click: tap(() => table.clear())}),
      Button({ label: 'Follow', active: follow, click: tap(() => follow.next(!follow.value))}),
    ),
    combineLatest([follow, now]).pipe(tap(([follow]) => follow && scrollToRight(timelineArea)), mapTo(null)),
    fromEvent(timelineArea, 'wheel').pipe(map(e => e as WheelEvent), map(e => {
      e.preventDefault()
      const { newInnerOffset, delta } = zoomArea(timelineArea, e, { intensity: 0.1, deadZone: { left: nodeSize + nodeMargin } })

      scale.next(scale.value * (1 + delta))
      timelineArea.scrollTo(newInnerOffset, timelineArea.scrollTop)

      return null
    })),
    timelineArea
  )

}
