import { Observable, MonoTypeOperatorFunction, Subscriber } from "rxjs";
import { observeElement } from "./mutation-observer";

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>): Observable<T> => new Observable(observer => {
    return source.subscribe({
      next(value) {
        if (el) {
          observeElement(el, observer, value);
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