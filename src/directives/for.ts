import $ from '../structures/value';
import $$ from '../structures/array';
import { Directive, Child } from "../types";
import { Fragment } from "../fragment";
import { untilExist } from "../operators";

export function $for<T extends unknown>(array: $$<T>, render: (item: $<T>) => Child): Directive {
  const fragment = new Fragment();

  return (parent: ChildNode): Fragment => {
    parent.appendChild(fragment.getRoot());

    array.pipe(untilExist(fragment.getRoot())).subscribe(list => {
      fragment.clear();
      list.forEach(v => {
        fragment.insertChild(render(v));
      });
    });

    array.insert$.pipe(untilExist(fragment.getRoot())).subscribe(({ item, i }: { item: $<T>; i: number }) => {
      fragment.insertChild(render(item), i);
    });

    array.remove$.pipe(untilExist(fragment.getRoot())).subscribe(({ i }) => {
      fragment.removeChild(i);
    });

    return fragment;
  };
}