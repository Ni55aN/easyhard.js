import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { appendChild, FunctionalChild, Fragment, DomElement, overrideRemove } from "../core";

export function xShow(state: Observable<any>, render: () => DomElement | FunctionalChild): FunctionalChild {

  return (parent: ChildNode) => {
    const el = appendChild(render(), parent);

    const sub = state.pipe(distinctUntilChanged()).subscribe(v => {
        const htmlElement = el instanceof Fragment ? el.getEdge() : el;

        if (htmlElement && 'style' in htmlElement) htmlElement.style.display = v ? '' : 'none';
    });

    el && overrideRemove(el, () => {
      sub.unsubscribe();
    });

    return el;
  };
}