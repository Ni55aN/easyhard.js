import { $$ } from 'easyhard-common'

export type TableItem =  { time: number, valueId: string, subscriberId: string, sourceSubscriberIds: string[] }
export type TableObservable = { id: string, data: TableItem }

export class Table {
  data = $$<TableObservable>([])

  add(id: string, data: TableItem) {
    this.data.insert({ id, data })
  }

  remove(id: string) {
    const item = this.data.getValue().find(el => el.id === id)

    if (item) {
      this.data.remove(item)
    }
  }

  asObservable() {
    return this.data
  }

  clear() {
    this.data.clear()
  }
}
