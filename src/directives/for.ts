import { appendChild } from "../core";
import $ from '../structures/value';
import $$ from '../structures/array';
import { Directive, Child } from "../types";
import { Fragment } from "../fragment";
import { untilExist } from "../operators";

export function $for<T extends any>(array: $$<T>, render: (item: $<T>) => Child): Directive {
  const fragment = new Fragment("$for");

  return (parent: ChildNode) => {
    parent.appendChild(fragment.getRoot());

    array.pipe(untilExist(fragment.getRoot())).subscribe(list => {
      fragment.clear();
      list.forEach(v => {
        const el = appendChild(render(v), parent, fragment.getEdge());

        fragment.insertChild(el);
      });
    });

    array.insert$.pipe(untilExist(fragment.getRoot())).subscribe(({ item, i }: { item: $<T>; i: number }) => {
      const el = appendChild(render(item), parent, fragment.getEdge(i));

      fragment.insertChild(el, i);
    });

    array.remove$.pipe(untilExist(fragment.getRoot())).subscribe(({ i }) => {
      fragment.removeChild(i);
    });

    return fragment;
  };
}