import { Subject, merge, Observable, of } from 'rxjs'
import { mergeMap, map, filter, tap } from 'rxjs/operators'
import { $ } from './value'

type Change<T extends 'insert' | 'remove', I> = { item: I; i: number; type: T }

export type readonly$$<T> = {
  value$: Observable<T[]>;
  change$: Observable<Change<'insert', T> | Change<'remove', T>>;
  value: T[];
  get(i: number): Observable<T>;
  length: Observable<number>;
}

export type $$<T> = readonly$$<T> & {
  value$: $<T[]>;
  change$: Subject<Change<'insert', T> | Change<'remove', T>>;
  insert(item: T, i?: number): void;
  removeAt(i: number): void;
  set(i: number, v: T): void;
  remove(item: T): void;
  clear(): void;
}



export const $filter = <T>(array: $$<T>, f: (item: T) => boolean): readonly$$<T> => {
  const value: T[] = array.value.filter(f)
  const value$ = array.value$.pipe(map(arr => arr.filter(f)), tap(arr => value.splice(0, value.length, ...arr)))
  const change$ = array.change$.pipe(filter(v => f(v.item)), map(v => {
    if (v.type === 'remove') {
      const i = value.indexOf(v.item)
      value.splice(i, 1)
      return { ...v, i }
    } else {
      const i = array.value.filter(f).indexOf(v.item)
      value.splice(i, 0, v.item)
      return { ...v, i }
    }
  }))

  return {
    value$,
    change$,
    get value(): T[] {
      return value
    },
    get(i: number): Observable<T> {
      return merge(value$, change$).pipe(
        mergeMap(() => {
          const item = value[i]
          return item instanceof Observable ? item : of(item)
        })
      )
    },
    get length(): Observable<number> {
      return merge(value$, change$).pipe(
        map(() => value.length)
      )
    }
  }
}

export const $$ = <T>(array: T[]): $$<T> => {
  const change$ = new Subject<Change<'insert', T> | Change<'remove', T>>()
  const value$ = $<T[]>(array)

  function insert(item: T, i = value$.value.length): void {
    value$.value.splice(i, 0, item)
    change$.next({ item, i, type: 'insert' })
  }

  function removeAt(i: number): void {
    if (i < 0) return
    const item = value$.value[i]

    value$.value.splice(i, 1)
    change$.next({ item, i, type: 'remove' })
  }

  return {
    value$,
    change$,
    get value(): T[] {
      return value$.value
    },
    get(i: number): Observable<T> {
      return merge(value$, change$).pipe(
        mergeMap(() => {
          const value = value$.value[i]
          return value instanceof Observable ? value : of(value)
        })
      )
    },
    set(i: number, v: T): void {
      removeAt(i)
      insert(v, i)
    },
    insert,
    remove(item: T): void {
      const index = value$.value.indexOf(item)
      removeAt(index)
    },
    removeAt,
    clear(): void {
      for (let i = value$.value.length - 1; i >=0; i--) {
        removeAt(i)
      }
    },
    get length(): Observable<number> {
      return merge(value$, change$).pipe(
        map(() => value$.value.length)
      )
    }
  }
}