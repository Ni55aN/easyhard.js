import { $ } from '../structures/value';
import { $$ } from '../structures/array';
import { DomElement, SimpleType } from "../types";
import { merge, OperatorFunction } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { untilExist } from '../operators';
import { createFragment } from '../utils';

export function $for<T extends any>(array: $$<T>, pipe?: OperatorFunction<T, DomElement | SimpleType>): DomElement {
  const fragment = createFragment();

  merge(array.insert$, array.remove$).pipe(
    startWith(null),
    untilExist(fragment.anchor)
  ).subscribe({
    next(args) {
      if (args === null) {
        array.value.forEach(item => fragment.insert(pipe ? $(item).pipe(pipe) : item));
      } else if ('item' in args) {
        fragment.insert(pipe ? $(args.item).pipe(pipe) : args.item, args.i)
      } else {
        fragment.remove(args.i);
      }
    },
    complete() { fragment.clear(); }
});

  return fragment.anchor;
}