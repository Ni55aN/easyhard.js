import { Observable } from "rxjs";
import { distinctUntilChanged, delay } from "rxjs/operators";
import { appendChild, overrideRemove } from "../core";
import { Directive, Child } from "../types";
import { Fragment } from "../fragment";

export function $if(state: Observable<any>, render: () => Child): Directive {
  const fragment = new Fragment('$if');

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

    overrideRemove(fragment.getRoot(), () => {
      sub.unsubscribe();
    });

    return fragment;
  };
}