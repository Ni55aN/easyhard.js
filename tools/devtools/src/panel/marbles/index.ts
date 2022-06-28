import { $, $if } from 'easyhard'
import { map } from 'rxjs/operators'
import { Table } from './table'
import { Timeline } from './views/timeline'
import { Graph } from './views/graph'

export type MarblesMode = 'timeline' | 'graph'

export function createMarbles<T extends string | number | boolean | object>(props: { mode: $<MarblesMode>, lineSelect: (id: string) => void }) {
  const table = new Table<T>()

  const container = $if(
    props.mode.pipe(map(m => m === 'timeline')),
    map(() => Timeline({ table })),
    map(() => Graph({ table, tap(id, parentId) { props.lineSelect(parentId || id) }}))
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
