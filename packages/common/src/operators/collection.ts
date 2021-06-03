/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { defer, EMPTY, Observable, of, pipe, UnaryFunction } from 'rxjs'
import { filter, map, mergeMap, scan, takeUntil } from 'rxjs/operators'
import { $$Return, getCollectionItemId } from '../structures/collection'

export function collectionLength<T>(): UnaryFunction<Observable<$$Return<T>>, Observable<number>> {
  return pipe(
    scan((acc, curr) => {
      return {
        length: acc.length + ('insert' in curr ? 1 : ('remove' in curr ? -1 : 0)),
        emit: 'idle' in curr || !('insert' in curr && curr.batch)
      }
    }, { length: 0 } as { length: number, emit?: boolean }),
    filter(arg => Boolean(arg.emit)),
    map(arg => arg.length),
  )
}

export function filterCollection<K>(predicate: (data: K) => Observable<boolean>) {
  type T = $$Return<K>
  return pipe<Observable<T>, Observable<T>>(
    source => defer(() => {
      const ids = new Set()
      let hadIdle = false

      return source.pipe(
        mergeMap(data => 'idle' in data ? (hadIdle = true, of(data)) : predicate(data.item).pipe(
          takeUntil(source.pipe(filter(source => 'remove' in source && 'insert' in data && getCollectionItemId(source.item) === getCollectionItemId(data.item)))),
          map(is => {
            if ('remove' in data) {
              const id = getCollectionItemId(data.item)

              if (ids.has(id)) return (ids.delete(id), data)
              return null
            }
            if ('insert' in data) {
              const id = getCollectionItemId(data.item)

              if (is && ids.has(id)) return null
              if (is) { ids.add(id); return data }
              if (ids.has(id)) { ids.delete(id); return { remove: true, item: data.item } as T }
              return null
            }
            return null
          }),
          source => new Observable(sub => {
            return source.subscribe({
              ...sub,
              next(v) {
                sub.next(v)
                // force 'length' update on batch insert after it was emitted initially
                if (hadIdle && v && 'insert' in v && v.batch) sub.next({ idle: true })
              }
            })
          }),
          filter((data): data is T => data !== null)
        ))
      )
    })
  )
}

export function forEachCollection<V, R>(handler: (item: V) => Observable<R>) {
  return pipe<Observable<$$Return<V>>, Observable<R>>(
    source => defer(() => {
      const list = new Map<unknown, Observable<R>>()

      return source.pipe(
        mergeMap(data => {
          if ('remove' in data) {
            const id = getCollectionItemId(data.item)

            list.delete(id)
            return EMPTY
          }
          if ('insert' in data) {
            const id = getCollectionItemId(data.item)
            const h = handler(data.item).pipe(
              takeUntil(source.pipe(
                filter(source => 'remove' in source),
                filter(source => {
                  const is = 'remove' in source && getCollectionItemId(source.item) === id
                  return is
                })
              ))
            )
            list.set(id, h)

            return h
          }
          return EMPTY
        })
      )
    })
  )
}
