import { $ } from '../structures/value'
import { readonly$$ } from '../structures/array'
import { DomElement, SimpleType, Anchor } from '../types'
import { merge, OperatorFunction, Observable, Subject } from 'rxjs'
import { filter, startWith, map } from 'rxjs/operators'
import { untilExist } from '../operators/until-exist'
import { createFragment } from '../fragment'

type ForFragment<T> = {
  anchor: Anchor;
  clear: () => void;
  insert: (item: T, i: number) => void;
  remove: (item: T, i: number) => void;
}

function createDetachedFragment<T>(pipe: OperatorFunction<[T, Observable<boolean>], DomElement | SimpleType>): ForFragment<T> {
  const fragment = createFragment()
  const detached$ = new Subject<T>()

  return {
    anchor: fragment.anchor,
    clear: fragment.clear,
    insert: (item: T, i: number): void => {
      const isDetached = detached$.pipe(map(n => item === n), filter(v => v), startWith(false))

      fragment.insert($<T>(item).pipe(map(item => ([item, isDetached] as [T, Observable<boolean>])), pipe), i)
    },
    remove(item: T, _: number): void {
      detached$.next(item)
    }
  }
}

function createAttachedFragment<T>(pipe: OperatorFunction<T, DomElement | SimpleType>): ForFragment<T> {
  const fragment = createFragment()

  return {
    anchor: fragment.anchor,
    clear: fragment.clear,
    insert(item: T, i: number): void {
      fragment.insert($<T>(item).pipe(pipe), i)
    },
    remove(_: T, i: number): void {
      fragment.remove(i)
    }
  }
}

export function $for<T>(array: readonly$$<T>, pipe: OperatorFunction<T, DomElement | SimpleType>): DomElement
export function $for<T>(array: readonly$$<T>, pipe: OperatorFunction<T, DomElement | SimpleType>, props: { detached: false }): DomElement
export function $for<T>(array: readonly$$<T>, pipe: OperatorFunction<[T, Observable<boolean>], DomElement | SimpleType>, props: { detached: true }): DomElement
export function $for<T>(array: readonly$$<T>, pipe: OperatorFunction<T | [T, Observable<boolean>], DomElement | SimpleType>, props?: { detached?: boolean }): DomElement {
  const fragment = props && props.detached ? createDetachedFragment<T>(pipe) : createAttachedFragment<T>(pipe)

  merge(array.change$).pipe(
    startWith([...array.value]),
    untilExist(fragment.anchor)
  ).subscribe({
    next(args) {
      if (Array.isArray(args)) {
        fragment.clear()
        args.forEach(fragment.insert)
      } else if (args.type === 'insert') {
        fragment.insert(args.item, args.i)
      } else if (args.type === 'remove') {
        fragment.remove(args.item, args.i)
      }
    },
    complete() { fragment.clear() }
  })

  return fragment.anchor
}