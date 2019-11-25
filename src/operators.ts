import { Observable, asapScheduler } from "rxjs";
import { takeWhile, delay } from "rxjs/operators";

export function untilExist(el: ChildNode | null) {
    return <T>(source: Observable<T>) => {
      return source.pipe(delay(0, asapScheduler), takeWhile<T>(() => {
        return Boolean(el) && document.body.contains(el);
      }));
    };
  }