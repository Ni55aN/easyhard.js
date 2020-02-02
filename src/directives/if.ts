import { Observable, of, UnaryFunction } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { SimpleType, DomElement } from "../types";

export function $if<T = SimpleType | DomElement>(state: Observable<boolean>, pipe: UnaryFunction<void, T | Observable<T>>): Observable<T | null> {
  return state.pipe(
    map(v => v ? pipe() : null),
    switchMap(ch => ch instanceof Observable ? ch : of(ch))
  );
}