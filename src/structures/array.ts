import { BehaviorSubject, Subject, merge, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import $ from './value';

export default class<T = any> extends $<$<T>[]> {
    insert$ = new Subject<{ item: any, i: number }>();
    remove$ = new Subject<{ i: number }>();
  
    get(i: number) {
      const s = new BehaviorSubject(null);
  
      return merge(s, this.insert$, this.remove$).pipe(
        mergeMap(_ => {
          return this.value[i];
        })
      );
    }
  
    set(i: number, v: $<T>) {
      this.removeAt(i);
      this.insert(v, i);
    }
  
    insert(item: $<T>, i = this.value.length) {
      if (!(item instanceof Observable)) throw new Error("not_observable");
  
      this.value.splice(i, 0, item);
      this.insert$.next({ item, i });
    }

    remove(item: $<T>) {
      const index = this.value.indexOf(item);

      this.removeAt(index);
    }
  
    removeAt(i: number) {
      this.value.splice(i, 1);
      this.remove$.next({ i });
    }

    clear() {
      for (let i = this.value.length - 1; i >=0; i--) {
        this.value.splice(i, 1);
        this.remove$.next({ i });
      }
    }

    get length() {
      return this.value.length;
    }
}