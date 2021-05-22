import { Observable, BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

export type Return<T> = T[] | { insert: true, item: T, i: number } | { remove: true, item: T, i: number }
export class ArraySubject<T> extends BehaviorSubject<Return<T>> {
  constructor(private __value: T[]) {
    super(__value)
  }

  get value(): T[] {
    return this.getValue()
  }

  getValue(): T[] {
    super.getValue() // trigger internal checks
    return this.__value
  }

  next(value: T[]): void {
    this.__value = value
    super.next([...this.__value])
  }

  insert(item: T, i = this.value.length): void {
    this.value.splice(i, 0, item)
    super.next({ item, i, insert: true })
  }

  removeAt(i: number): void {
    if (i < 0) return
    const item = this.value[i]

    this.value.splice(i, 1)
    super.next({ item, i, remove: true })
  }

  get(i: number): Observable<T> {
    return this.pipe(
      map(() => this.value[i])
    )
  }

  set(i: number, v: T): void {
    this.removeAt(i)
    this.insert(v, i)
  }

  remove(item: T): void {
    const index = this.value.indexOf(item)

    this.removeAt(index)
  }

  clear(): void {
    this.next([])
  }

  get length(): Observable<number> {
    return this.pipe(
      map(() => this.value.length)
    )
  }
}
export const $$ = <T>(val: T[]): ArraySubject<T> => new ArraySubject(val)
export type $$<T> = ArraySubject<T>;
export type $$Return<T> = Return<T>
