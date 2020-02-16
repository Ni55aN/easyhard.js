import { Observable, of, OperatorFunction } from "rxjs";
import { switchMap } from "rxjs/operators";
import { SimpleType, DomElement } from "../types";

type Pipe = OperatorFunction<boolean, SimpleType | DomElement>;

export function $if(state: Observable<boolean>, pipe: Pipe, elsePipe?: Pipe): Observable<SimpleType | DomElement> {
  return state.pipe(
    switchMap(v => {
      if (v) return of(v).pipe(pipe);
      if (elsePipe) return of(v).pipe(elsePipe);
      return of(null);
    })
  );
}