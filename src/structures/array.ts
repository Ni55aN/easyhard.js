import { Subject, merge, Observable, of } from "rxjs";
import { mergeMap, startWith, map } from "rxjs/operators";
import $ from './value';

export default class<T = unknown> extends $<T[]> {
    insert$ = new Subject<{ item: T; i: number }>();
    remove$ = new Subject<{ i: number }>();
  
    get(i: number): Observable<T> {
      return merge(this.insert$, this.remove$).pipe(
        startWith(null),
        mergeMap(() => {
          const value = this.value[i];
          return value instanceof Observable ? value : of(value)
        })
      );
    }
  
    set(i: number, v: T): void {
      this.removeAt(i);
      this.insert(v, i);
    }
  
    insert(item: T, i = this.value.length): void {
      if (!(item instanceof Observable)) throw new Error("not_observable");
  
      this.value.splice(i, 0, item);
      this.insert$.next({ item, i });
    }

    remove(item: T): void {
      const index = this.value.indexOf(item);

      this.removeAt(index);
    }
  
    removeAt(i: number): void {
      this.value.splice(i, 1);
      this.remove$.next({ i });
    }

    clear(): void {
      for (let i = this.value.length - 1; i >=0; i--) {
        this.value.splice(i, 1);
        this.remove$.next({ i });
      }
    }

    get length(): Observable<number> {
      return merge(this.insert$, this.remove$).pipe(
        startWith(null),
        map(() => this.value.length)
      );
    }
}