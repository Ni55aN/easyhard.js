import { Observable, MonoTypeOperatorFunction } from "rxjs";
import { observeElement } from "./mutation-observer";

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>): Observable<T> => new Observable(observer => {
    let observed = false;

    return source.subscribe({
      next(value) {
        if (el && !observed) {
          observeElement(el, observer, value);
          observed = true;
        }
        if (Boolean(el) && container.contains(el)) {
          observer.next(value);
        }
      },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    });
  });
}