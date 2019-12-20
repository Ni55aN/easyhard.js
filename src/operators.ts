import { Observable, asapScheduler, MonoTypeOperatorFunction } from "rxjs";
import { takeWhile, delay } from "rxjs/operators";

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    return source.pipe(delay(0, asapScheduler), takeWhile<T>(() => {
      return Boolean(el) && container.contains(el);
    }));
  };
}