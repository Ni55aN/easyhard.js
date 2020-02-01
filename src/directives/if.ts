import { Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { DomElement, SimpleType } from "../types";

export function $if(state: Observable<boolean>, child: () => DomElement | SimpleType | Observable<DomElement | SimpleType>): Observable<DomElement | SimpleType> {
  return state.pipe(
    map(v => v ? child() : null),
    switchMap(ch => ch instanceof Observable ? ch : of(ch))
  );
}