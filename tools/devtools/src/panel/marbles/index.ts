import { $, h } from 'easyhard'
import { injectStyles } from 'easyhard-styles'
import { combineLatest, fromEvent, interval } from 'rxjs'
import { map, mapTo, shareReplay, tap } from 'rxjs/operators'
import { nodeMargin, nodeSize } from './consts'
import { ControlButton } from './ControlPanel'
import { Table } from './table'
import { TimelineArea } from './TimelineArea'
import { scrollToRight, zoomArea } from './utils'

export function createMarbles<T extends string | number | boolean | object>() {
  const table = new Table<T>()
  const scale = $(0.05)
  const follow = $(false)
  const now = interval(200).pipe(map(() => Date.now())).pipe(shareReplay())
  const timelineArea = TimelineArea({ data: table, scale, now })

  const container = h('div', {}, injectStyles({ display: 'flex', flexDirection: 'column', maxHeight: '100%' }),
    h('div', {},
      ControlButton({ label: 'Clear', click: tap(() => table.clear())}),
      ControlButton({ label: 'Follow', active: follow, click: tap(() => follow.next(!follow.value))}),
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

  return {
    container,
    add(value: T, id: string, parents: string[], time: number) {
      table.add(id, { emission: value, time, parents })
    },
    remove(id: string) {
      table.remove(id)
    }
  }
}
