/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { $, $for, h } from 'easyhard'
import { injectStyles } from 'easyhard-styles'
import { timer } from 'rxjs'
import { map } from 'rxjs/operators'
import { Table } from './table'
import { Timeline } from './Timeline'

export function createMarbles<T extends string | number | boolean | object>() {
  const table = new Table<T>()
  const scale = $(0.05)
  const start = table.getStart()
  const now = timer(0, 1000/30).pipe(map(() => Date.now()))
  const container = h('div', {}, injectStyles({ overflow: 'auto', maxHeight: '100%' }),
    $for(table.asObservable(), map(item => h('div', {}, Timeline({ scale, now, start, ...item }))))
  )

  container.addEventListener('wheel', e => {
    e.preventDefault()
    scale.next(scale.value * (1 - e.deltaY / 1000))
  })

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
