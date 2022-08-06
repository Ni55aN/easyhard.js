import { Subject } from 'rxjs'
import { ObservableEmissionType } from 'src/types'
import { Table } from './table'
import { Graph } from './views/graph'

type Props = {
  debug?: boolean
  lineSelect: (id: string) => void
  log: (valueId: string | string[]) => void
  fetchValue: (id: string, valueId: string) => void
}

export function createMarbles(props: Props) {
  const table = new Table()
  const focus = new Subject<string>()
  const toggle = new Subject<{ id: string, hidden: boolean }>()
  const setValue = new Subject<{ valueId: string, value: any, type: ObservableEmissionType }>()

  const container = Graph({
    table,
    focus,
    setValue,
    toggle,
    debug: props.debug,
    tap(id, parentId) { props.lineSelect(parentId || id) },
    log(valueId) { props.log(valueId) },
    fetchValue(id, valueId) { props.fetchValue(id, valueId) }
  })

  return {
    container,
    add(id: string, subscriberId: string, sourceSubscriberIds: string[], time: number, valueId: string) {
      table.add(id, { time, subscriberId, sourceSubscriberIds, valueId })
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
    setValue(valueId: string, value: any, type: ObservableEmissionType) {
      setValue.next({ valueId, value, type })
    },
    toggle(id: string, hidden: boolean) {
      toggle.next({ id, hidden })
    }
  }
}
