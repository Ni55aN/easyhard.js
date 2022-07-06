import { Subject } from 'rxjs'
import { Table } from './table'
import { Graph } from './views/graph'

type Props = {
  debug?: boolean
  lineSelect: (id: string) => void
  log: (valueId: string) => void
}

export function createMarbles<T extends string | number | boolean | object>(props: Props) {
  const table = new Table<T>()
  const focus = new Subject<string>()

  const container = Graph({
    table,
    focus,
    debug: props.debug,
    tap(id, parentId) { props.lineSelect(parentId || id) },
    log(valueId) { props.log(valueId) }
  })

  return {
    container,
    add(value: T, id: string, parents: string[], time: number, valueId: string) {
      table.add(id, { emission: value, time, parents, valueId })
    },
    remove(id: string) {
      table.remove(id)
    },
    clear() {
      table.clear()
    },
    focus(id: string) {
      focus.next(id)
    }
  }
}
