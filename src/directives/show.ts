import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { appendChild } from "../core";
import { DomElement, Directive } from "../types";
import { Fragment } from "../fragment";
import { untilExist } from "../operators";

export function $show(state: Observable<any>, render: () => DomElement | Directive): Directive {
  return (parent: ChildNode) => {
    const el = appendChild(render(), parent);

    state.pipe(untilExist(el instanceof Fragment ? el.getRoot() : el), distinctUntilChanged()).subscribe(v => {
        const htmlElement = el instanceof Fragment ? el.getEdge() : el;

        if (htmlElement && 'style' in htmlElement) htmlElement.style.display = v ? '' : 'none';
    });

    return el;
  };
}