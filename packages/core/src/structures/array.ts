import { Subject, merge, Observable, of } from 'rxjs'
import { mergeMap, map } from 'rxjs/operators'
import { $ } from './value'

type Change<T extends 'insert' | 'remove', I> = { item: I; i: number; type: T }

export type $$<T> = {
  value$: $<T[]>;
  change$: Subject<Change<'insert', T> | Change<'remove', T>>;
  value: T[];
  get(i: number): Observable<T>;
  insert(item: T, i?: number): void;
  removeAt(i: number): void;
  set(i: number, v: T): void;
  remove(item: T): void;
  clear(): void;
  length: Observable<number>;
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