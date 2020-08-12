import { $ } from '../structures/value';
import { $$ } from '../structures/array';
import { DomElement, SimpleType } from "../types";
import { merge, OperatorFunction } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { untilExist } from '../operators';
import { createFragment } from '../utils';

export function $for<T extends any>(array: $$<T>, pipe?: OperatorFunction<T, DomElement | SimpleType>): DomElement {
  const fragment = createFragment();

  merge(array.change$).pipe(
    startWith([...array.value]),
    untilExist(fragment.anchor)
  ).subscribe({
    next(args) {
      if (Array.isArray(args)) {
        fragment.clear()
        args.forEach((item: any) => fragment.insert(pipe ? $(item).pipe(pipe) : item));
      } else if (args.type === 'insert') {
        fragment.insert(pipe ? $(args.item).pipe(pipe) : args.item, args.i)
      } else if (args.type === 'remove') {
        fragment.remove(args.i);
      }
    },
    complete() { fragment.clear(); }
});

  return fragment.anchor;
}