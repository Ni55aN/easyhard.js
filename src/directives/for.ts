import $ from '../structures/value';
import $$ from '../structures/array';
import { Child, DomElement } from "../types";
import { merge } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { untilExist } from '../operators';
import { createFragment } from '../utils';

export function $for<T extends unknown>(array: $$<T>, render: (item: $<T>) => Child): DomElement {
  const fragment = createFragment();

  merge(array.insert$, array.remove$).pipe(
    startWith(null),
    untilExist(fragment.anchor)
  ).subscribe(args => {
    if (args === null) {
      array.value.forEach(item => fragment.insert(render(item)));
    } else if ('item' in args) {
      fragment.insert(render(args.item), args.i)
    } else {
      fragment.remove(args.i);
    }
  });

  return fragment.anchor;
}