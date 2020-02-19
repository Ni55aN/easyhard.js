import { Observable, of, OperatorFunction } from "rxjs";
import { switchMap } from "rxjs/operators";

type Pipe<T> = OperatorFunction<boolean, T>;

export function $if<T>(state: Observable<boolean>, pipe: Pipe<T>, elsePipe?: Pipe<T>): Observable<T | null> {
  return state.pipe(
    switchMap(v => {
      if (v) return of(v).pipe(pipe);
      if (elsePipe) return of(v).pipe(elsePipe);
      return of(null);
    })
  );
}