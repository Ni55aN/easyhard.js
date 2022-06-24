/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { $for, h } from 'easyhard'
import { injectStyles } from 'easyhard-styles'
import { combineLatest, Observable, pipe } from 'rxjs'
import { delay, map } from 'rxjs/operators'
import { Connection } from './Connection'
import { timelineHeight } from './consts'
import { Table, TableObservable } from '../../table'
import { TimelineItem } from './TimelineItem'


function sortByReferences<T>(a: TableObservable<T>, b: TableObservable<T>) {
  const currentId = a.id
  const currentReferencesIds = a.data.getValue().map(item => item.parents).flat()
  const nextId = b.id
  const nextReferencesIds = b.data.getValue().map(item => item.parents).flat()

  return nextReferencesIds.includes(currentId) && !currentReferencesIds.includes(nextId)
}

function findTimelineIndex(id: string) {
  const startTimeline = document.getElementById(`timeline_${String(id)}`)
  const timelines = startTimeline?.parentElement && Array.from(startTimeline.parentElement.children).filter(n => n.getAttribute('id')?.startsWith('timeline_'))

  return timelines ? timelines.indexOf(startTimeline) : -1
}

export function TimelineArea<T>(props: { data: Table<T>, scale: Observable<number>, now: Observable<number> }) {
  const { data, now, scale } = props
  const start = data.getStart()

  return h('div', {}, injectStyles({ overflow: 'auto', paddingRight: '0.5em', position: 'relative' }),
    $for(data.asObservable(), map(item => {
      return h('div', { id: `timeline_${String(item.id)}` }, TimelineItem({ scale, now, start, ...item }))
    }), {
      comparator: sortByReferences
    }),
    $for(data.asObservable(), pipe(delay(100), map(item => {
      return h('div', {},
        $for(item.data, map(marble => {
          if (!marble.parents.length) return null
          const originIndex = findTimelineIndex(item.id)

          return h('span', {},
            marble.parents.map(parent => {
              const index = findTimelineIndex(parent)

              if (originIndex >= 0 && index >= 0) {
                const line = combineLatest([scale, start]).pipe(map(([scale, min]) => {
                  const parentPrevMarbles = data.getRow(parent)?.data.getValue().filter(p => p.time <= marble.time)
                  const latestParentMarble = parentPrevMarbles?.pop()

                  return {
                    start: { x: scale * ((latestParentMarble ? latestParentMarble.time : min) - min), y: (index + 0.5) * timelineHeight },
                    end: { x: scale * (marble.time - min), y: (originIndex + 0.5) * timelineHeight }
                  }
                }))

                return Connection(line)
              }
              console.warn('cannot render connection', { parent, originIndex, index })
              return null
            })
          )
        }))
      )
    })))
  )
}
