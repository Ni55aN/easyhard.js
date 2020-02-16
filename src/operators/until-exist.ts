import { Observable, MonoTypeOperatorFunction } from "rxjs";
import { observeElement } from "../mutation-observer";

export function untilExist<T>(el: ChildNode | null, container: Node = document.body): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>): Observable<T> => new Observable(observer => {
    let observed = false;
    let lastValue: T;

    return source.subscribe({
      next(value) {
        lastValue = value;
        if (el && !observed) {
          observeElement(el, observer, () => lastValue);
          observed = true;
        }
        if (Boolean(el) && container.contains(el)) {
          observer.next(lastValue);
        }
      },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    });
  });
}