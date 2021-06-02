import { Subject, Observable, Subscriber, Subscription, ObjectUnsubscribedError } from 'rxjs'
import { map, startWith } from 'rxjs/operators'

export type InsertReturn<T> = { insert: true, item: T, batch?: boolean }
export type RemoveReturn<T> = { remove: true, item: T }
export type Return<T> = { idle: true } | InsertReturn<T> | RemoveReturn<T>

export const getCollectionItemId = <T>(item: T): T | unknown => typeof item === 'object' && 'id' in item ? (item as any).id : item

// TODO rename CollectionSubject
export class ArraySubject<T> extends Subject<Return<T>> {
  constructor(private _value: T[]) {
    super()
  }

  get value(): T[] {
    return this.getValue()
  }

  _subscribe(subscriber: Subscriber<Return<T>>): Subscription {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const subscription = super._subscribe(subscriber)
    if (subscription && !subscription.closed) {
      this._value.forEach(item => {
        subscriber.next({ insert: true, item, batch: true })
      })
      subscriber.next({ idle: true })
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

  next(value: Return<T>): void {
    if ('insert' in value) return this.insert(value.item)
    if ('remove' in value) return this.remove(value.item)
    throw new Error('Argument type is invalid')
  }

  insert(item: T): void {
    this._value.push(item)
    super.next({ item, insert: true })
  }

  remove(item: T): void {
    const id = getCollectionItemId(item)
    const i = typeof item === 'object' && 'id' in item ? this._value.findIndex(el => getCollectionItemId(el) === id) : this._value.indexOf(item)
    if (i < 0) return

    this._value.splice(i, 1)
    super.next({ item, remove: true })
  }

  get(i: number): Observable<T> {
    return this.pipe(
      startWith(null),
      map(() => this.value[i])
    )
  }

  clear(): void {
    while(this._value.length > 0) {
      this.remove(this._value[0])
    }
  }

  get length(): Observable<number> {
    return this.pipe(
      startWith(null),
      map(() => this.value.length)
    )
  }
}
export const $$ = <T>(val: T[]): ArraySubject<T> => new ArraySubject(val)
export type $$<T> = ArraySubject<T>;
export type $$Return<T> = Return<T>
