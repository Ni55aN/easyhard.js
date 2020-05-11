import { Observable, MonoTypeOperatorFunction } from "rxjs";
import { observeElement } from "../mutation-observer";

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>): Observable<T> => new Observable(observer => {
    let lastValue: T;

    if (el) observeElement(el, observer, () => lastValue);

    return source.subscribe({
      next(value) {
        lastValue = value;
        if (Boolean(el) && container.contains(el)) {
          observer.next(lastValue);
        }
      },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    });
  });
}