import { Observable } from "rxjs";
import { distinctUntilChanged, delay } from "rxjs/operators";
import { appendChild } from "../core";
import { Directive, Child } from "../types";
import { Fragment } from "../fragment";
import { untilExist } from "../operators";

export function $if(state: Observable<any>, render: () => Child): Directive {
  const fragment = new Fragment('$if');

  return (parent: ChildNode) => {
    parent.appendChild(fragment.getRoot());
    
    state.pipe(untilExist(fragment.getRoot()), distinctUntilChanged()).subscribe(v => {
      if (Boolean(v)) {
        const el = appendChild(render(), parent, fragment);

        fragment.insertChild(el, 0);
      } else {
        fragment.removeChild(0);
      }
    });

    return fragment;
  };
}