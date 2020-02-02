import { Observable, of, UnaryFunction } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { SimpleType, DomElement } from "../types";

type Pipe<T> = UnaryFunction<void, T | Observable<T>>;

export function $if<T = SimpleType | DomElement>(state: Observable<boolean>, pipe: Pipe<T>, elsePipe?: Pipe<T>): Observable<T | null> {
  return state.pipe(
    map(v => v ? pipe() : elsePipe ? elsePipe() : null),
    switchMap(ch => ch instanceof Observable ? ch : of(ch))
  );
}