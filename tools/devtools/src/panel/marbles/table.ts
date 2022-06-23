import { $$ } from 'easyhard-common'
import { combineLatest, Observable } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'

export type TableItem<T> =  { emission: T, time: number, references: { id: string, index: number }[] }

export class Table<T> {
  data = $$<{ id: string, data: $$<TableItem<T>> }>([])

  add(id: string, data: TableItem<T>) {
    if (!this.data.getValue().find(v => v.id === id)) this.data.insert({ id, data: $$<TableItem<T>>([]) })

    this.data.getValue().find(v => v.id === id)?.data.insert(data)
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

  getRow(id: string) {
    return this.data.getValue().find(v => v.id === id)
  }

  getStart(): Observable<number> {
    const d = this.data.pipe(mergeMap(() => combineLatest(this.data.getValue().map(m => m.data.pipe(map(() => m.data.getValue()))))))

    return d.pipe(map(v => Math.min(...v.flat().map(item => item.time))))
  }

  clear() {
    this.data.getValue().forEach(item => {
      item.data.clear()
    })
  }
}
