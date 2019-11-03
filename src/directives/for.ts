import { Observable } from "rxjs";
import { appendChild, overrideRemove, FunctionalChild, Fragment } from "../core";
import ReactiveArray from '../structures/array';

export function xFor(array: ReactiveArray, render: (item: Observable<any>) => HTMLElement | FunctionalChild): FunctionalChild {
  const fragment = new Fragment("xFor");

  return (parent: ChildNode) => {
    parent.appendChild(fragment.getRoot());

    const sub1 = array.subscribe(list => {
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