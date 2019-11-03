import { Observable } from "rxjs";
import { distinctUntilChanged, delay } from "rxjs/operators";
import { appendChild, FunctionalChild, Fragment, DomElement, overrideRemove } from "../core";

export function xIf(state: Observable<any>, render: () => DomElement | FunctionalChild): FunctionalChild {
  const fragment = new Fragment('xIf');

  return (parent: ChildNode) => {
    parent.appendChild(fragment.getRoot());
    
    const sub = state.pipe(distinctUntilChanged(), delay(0)).subscribe(v => {
      if (Boolean(v)) {
        const el = appendChild(render(), parent, fragment);

        fragment.insertChild(el, 0);
      } else {
        fragment.removeChild(0);
      }
    });

    overrideRemove(fragment, () => {
      sub.unsubscribe();
    });

    return fragment;
  };
}