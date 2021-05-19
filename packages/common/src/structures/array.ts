import { Subject, Observable, Subscriber, Subscription, SubscriptionLike, ObjectUnsubscribedError } from 'rxjs'
import { map } from 'rxjs/operators'

export type ArrayEvent<T> = T[] | { insert: true, item: T, i: number } | { remove: true, item: T, i: number }

export class ArraySubject<T> extends Subject<ArrayEvent<T>> {
  constructor(private _value: T[]) {
    super()
  }

  get value(): T[] {
    return this.getValue()
  }

  _subscribe(subscriber: Subscriber<T[]>): Subscription {
    const subscription = super._subscribe(subscriber)
    if (subscription && !(<SubscriptionLike>subscription).closed) {
      subscriber.next([...this._value])
    }
    return subscription
  }

  getValue(): T[] {
    if (this.hasError) {
      throw this.thrownError
    } else if (this.closed) {
      throw new ObjectUnsubscribedError()
    } else {
      return this._value
    }
  }

  next(value: T[]): void {
    this._value = value
    super.next([...this._value])
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
