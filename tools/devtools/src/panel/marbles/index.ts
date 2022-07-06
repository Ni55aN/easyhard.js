import { Subject } from 'rxjs'
import { Table } from './table'
import { Graph } from './views/graph'

type Props = {
  debug?: boolean
  lineSelect: (id: string) => void
  log: (valueId: string) => void
  fetchValue: (id: string, valueId: string) => void
}

export function createMarbles(props: Props) {
  const table = new Table()
  const focus = new Subject<string>()
  const setValue = new Subject<{ valueId: string, value: any }>()

  const container = Graph({
    table,
    focus,
    setValue,
    debug: props.debug,
    tap(id, parentId) { props.lineSelect(parentId || id) },
    log(valueId) { props.log(valueId) },
    fetchValue(id, valueId) { props.fetchValue(id, valueId) }
  })

  return {
    container,
    add(id: string, parents: string[], time: number, valueId: string) {
      table.add(id, { time, parents, valueId })
    },
    remove(id: string) {
      table.remove(id)
    },
    clear() {
      table.clear()
    },
    focus(id: string) {
      focus.next(id)
    },
    setValue(valueId: string, value: any) {
      setValue.next({ valueId, value })
    }
  }
}
