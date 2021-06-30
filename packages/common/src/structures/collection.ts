import { Subject, Subscriber, Subscription, ObjectUnsubscribedError } from 'rxjs'

export type InsertReturn<T> = { insert: true, item: T, batch?: boolean }
export type RemoveReturn<T> = { remove: true, item: T }
export type Return<T> = { idle: true } | { initial: true } |  InsertReturn<T> | RemoveReturn<T>

export function getCollectionItemId<T>(item: T): T | unknown {
  return typeof item === 'object' && 'id' in item ? (item as unknown as { id: string }).id : item
}

export class CollectionSubject<T> extends Subject<Return<T>> {
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
      subscriber.next({ initial: true })
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

  clear(): void {
    while(this._value.length > 0) {
      this.remove(this._value[0])
    }
  }
}
export const $$ = <T>(val: T[]): CollectionSubject<T> => new CollectionSubject(val)
export type $$<T> = CollectionSubject<T>;
export type $$Return<T> = Return<T>
