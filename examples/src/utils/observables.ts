import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export function not(ob: Observable<boolean>) {
  return ob.pipe(map(v => !v));
}
