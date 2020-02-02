import $$ from '../structures/array';
import { DomElement, Child } from "../types";
import { merge, OperatorFunction, UnaryFunction, Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { untilExist } from '../operators';
import { createFragment } from '../utils';

export function $for<T extends any>(array: $$<T>, pipe?: UnaryFunction<Observable<T>, Child>): DomElement {
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