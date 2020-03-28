import { Subject, merge, Observable, of } from "rxjs";
import { mergeMap, startWith, map } from "rxjs/operators";
import { $ } from './value';

export type $$<T> = {
  insert$: Subject<{ item: T; i: number }>;
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
  const insert$ = new Subject<{ item: T; i: number }>();
  const remove$ = new Subject<{ i: number }>();
  const self = $(array);

  function insert(item: T, i = self.value.length): void {
    if (!(item instanceof Observable)) throw new Error("not_observable");

    self.value.splice(i, 0, item);
    insert$.next({ item, i });
  }

  function removeAt(i: number): void {
    self.value.splice(i, 1);
    remove$.next({ i });
  }

  return {
    insert$,
    remove$,
    get value(): T[] {
      return self.value;
    },
    get(i: number): Observable<T> {
      return merge(insert$, remove$).pipe(
        startWith(null),
        mergeMap(() => {
          const value = self.value[i];
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
      const index = self.value.indexOf(item);
      removeAt(index);
    },
    removeAt,
    clear(): void {
      for (let i = self.value.length - 1; i >=0; i--) {
        self.value.splice(i, 1);
        remove$.next({ i });
      }
    },
    get length(): Observable<number> {
      return merge(insert$, remove$).pipe(
        startWith(null),
        map(() => self.value.length)
      );
    }
  }
}