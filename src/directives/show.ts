import { Observable, UnaryFunction } from "rxjs";
import { map, switchMap } from "rxjs/operators";

function changeVisibility(visible: boolean, child: HTMLElement): HTMLElement {
  child.style.display = visible ? '' : 'none';
  return child;
}

export function $show(state: Observable<boolean>, pipe: UnaryFunction<void, HTMLElement | Observable<HTMLElement>>): Observable<HTMLElement> {
  const child = pipe();

  return state.pipe(child instanceof Observable
    ? switchMap(v => child.pipe(map(ch => changeVisibility(v, ch))))
    : map(v => changeVisibility(v, child)),
  );
}