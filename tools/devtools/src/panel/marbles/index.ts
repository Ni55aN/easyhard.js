/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { $, $for, h } from 'easyhard'
import { injectStyles } from 'easyhard-styles'
import { animationFrameScheduler, combineLatest, fromEvent, interval } from 'rxjs'
import { map, mapTo, shareReplay, tap } from 'rxjs/operators'
import { nodeMargin, nodeSize } from './consts'
import { ControlButton } from './ControlPanel'
import { Table } from './table'
import { Timeline } from './Timeline'
import { scrollToRight, zoomArea } from './utils'

export function createMarbles<T extends string | number | boolean | object>() {
  const table = new Table<T>()
  const scale = $(0.05)
  const follow = $(false)
  const start = table.getStart()
  const now = interval(0, animationFrameScheduler).pipe(map(() => Date.now())).pipe(shareReplay())

  const timelineArea = h('div', {}, injectStyles({ overflow: 'auto', maxHeight: '100%', paddingRight: '0.5em' }),
    $for(table.asObservable(), map(item => h('div', {}, Timeline({ scale, now, start, ...item }))))
  )

  const container = h('div', {},
    ControlButton({ label: 'Clear', click: tap(() => table.clear())}),
    ControlButton({ label: 'Follow', active: follow, click: tap(() => follow.next(!follow.value))}),
    combineLatest([follow, now]).pipe(tap(([follow]) => follow && scrollToRight(timelineArea)), mapTo(null)),
    fromEvent(timelineArea, 'wheel').pipe(map(e => e as WheelEvent), map(e => {
      e.preventDefault()
      const { newInnerOffset, delta } = zoomArea(timelineArea, e, { intensity: 0.1, deadZone: { left: nodeSize + nodeMargin } })

      scale.next(scale.value * (1 + delta))
      timelineArea.scrollTo(newInnerOffset, 0)

      return null
    })),
    timelineArea
  )

  return {
    container,
    add(value: T, id: string, parents: string[], time: number) {
      const references = parents
        .filter(id => table.getRow(id))
        .map(parentId => {
          const parentEmits = table.getRow(parentId)

          if (!parentEmits) throw new Error('cannot find parentId = ' + parentId)

          return { id: parentId, index: parentEmits.data.getValue().length - 1 }
        })
      table.add(id, { emission: value, time, references })
    }
  }
}
