import $ from '../structures/value';
import $$ from '../structures/array';
import { DomElement, SimpleType } from "../types";
import { merge, OperatorFunction, of } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { untilExist } from '../operators';
import { createFragment } from '../utils';

export function $for<T extends any>(array: $$<T>, pipe?: OperatorFunction<$<T>, DomElement | SimpleType>): DomElement {
  const fragment = createFragment();

  merge(array.insert$, array.remove$).pipe(
    startWith(null),
    untilExist(fragment.anchor)
  ).subscribe(args => {
    if (args === null) {
      array.value.forEach(item => fragment.insert(pipe ? new $(item).pipe(pipe) : item));
    } else if ('item' in args) {
      fragment.insert(pipe ? new $(args.item).pipe(pipe) : args.item, args.i)
    } else {
      fragment.remove(args.i);
    }
  });

  return fragment.anchor;
}