import $ from '../structures/value';
import $$ from '../structures/array';
import { Child, DomElement } from "../types";
import { merge, UnaryFunction } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { untilExist } from '../operators';
import { createFragment } from '../utils';

export function $for<T extends any>(array: $$<T>, pipe?: UnaryFunction<$<T>, Child>): DomElement {
  const fragment = createFragment();

  merge(array.insert$, array.remove$).pipe(
    startWith(null),
    untilExist(fragment.anchor)
  ).subscribe(args => {
    if (args === null) {
      array.value.forEach(item => fragment.insert(pipe ? pipe(item) : item));
    } else if ('item' in args) {
      fragment.insert(pipe ? pipe(args.item) : args.item, args.i)
    } else {
      fragment.remove(args.i);
    }
  });

  return fragment.anchor;
}