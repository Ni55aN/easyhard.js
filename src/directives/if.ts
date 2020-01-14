import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { Directive, Child } from "../types";
import { Fragment } from "../fragment";
import { untilExist } from "../operators";

export function $if(state: Observable<boolean>, render: () => Child): Directive {
  const fragment = new Fragment();

  return (parent: ChildNode): Fragment => {
    parent.appendChild(fragment.getRoot());
    
    state.pipe(untilExist(fragment.getRoot()), distinctUntilChanged()).subscribe(visible => {
      if (visible) {
        fragment.insertChild(render(), 0);
      } else {
        fragment.removeChild(0);
      }
    });

    return fragment;
  };
}