import { Subject, merge, Observable, of } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { $ } from './value';

export type $$<T> = {
  value$: $<T[]>;
  insert$: Subject<{ item: any; i: number }>;
  remove$: Subject<{ i: number }>;
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
  const insert$ = new Subject<{ item: unknown; i: number }>();
  const remove$ = new Subject<{ i: number }>();
  const value$ = $<T[]>(array);

  function insert(item: T, i = value$.value.length): void {
    value$.value.splice(i, 0, item);
    insert$.next({ item, i });
  }

  function removeAt(i: number): void {
    value$.value.splice(i, 1);
    remove$.next({ i });
  }

  return {
    value$,
    insert$,
    remove$,
    get value(): T[] {
      return value$.value;
    },
    get(i: number): Observable<T> {
      return merge(value$, insert$, remove$).pipe(
        mergeMap(() => {
          const value = value$.value[i];
          return value instanceof Observable ? value : of(value)
        })
      );
    },
    set(i: number, v: T): void {
      removeAt(i);
      insert(v, i);
    },
    insert,
    remove(item: T): void {
      const index = value$.value.indexOf(item);
      removeAt(index);
    },
    removeAt,
    clear(): void {
      for (let i = value$.value.length - 1; i >=0; i--) {
        value$.value.splice(i, 1);
        remove$.next({ i });
      }
    },
    get length(): Observable<number> {
      return merge(value$, insert$, remove$).pipe(
        map(() => value$.value.length)
      );
    }
  }
}