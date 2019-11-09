import { Observable } from "rxjs";
import { appendChild, overrideRemove } from "../core";
import $ from '../structures/array';
import { delay } from "rxjs/operators";
import { FunctionalChild } from "../types";
import { Fragment } from "../fragment";

export function $for(array: $, render: (item: Observable<any>) => HTMLElement | FunctionalChild): FunctionalChild {
  const fragment = new Fragment("$for");

  return (parent: ChildNode) => {
    parent.appendChild(fragment.getRoot());

    const sub1 = array.pipe(delay(0)).subscribe(list => {
      fragment.clear();
      list.forEach(v => {
        const el = appendChild(render(v), parent, fragment.getEdge());

        fragment.insertChild(el);
      });
    });

    const sub2 = array.insert$.subscribe(({ item, i }: { item: Observable<any>; i: number }) => {
      const el = appendChild(render(item), parent, fragment.getEdge(i));

      fragment.insertChild(el, i);
    });

    const sub3 = array.remove$.subscribe(({ i }) => {
      fragment.removeChild(i);
    });

    overrideRemove(fragment, () => {
      [sub1, sub2, sub3].forEach(sub => sub.unsubscribe());
    });

    return fragment;
  };
}