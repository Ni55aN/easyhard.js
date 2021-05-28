import { $, $$Return, getCollectionItemId } from 'easyhard-common'
import { DomElement, SimpleType, Anchor } from '../types'
import { OperatorFunction, Observable, Subject } from 'rxjs'
import { filter, startWith, map } from 'rxjs/operators'
import { untilExist } from '../operators/until-exist'
import { createFragment } from '../fragment'

type ForFragment<T> = {
  anchor: Anchor;
  clear: () => void;
  insert: (item: T, i?: number) => void;
  remove: (item: T, i: number) => void;
}

function createDetachedFragment<T>(pipe: OperatorFunction<[T, Observable<boolean>], DomElement | SimpleType>): ForFragment<T> {
  const fragment = createFragment()
  const detached$ = new Subject<T>()

  return {
    anchor: fragment.anchor,
    clear: fragment.clear,
    insert: (item: T, i?: number): void => {
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
    insert(item: T, i?: number): void {
      fragment.insert($<T>(item).pipe(pipe), i)
    },
    remove(_: T, i: number): void {
      fragment.remove(i)
    }
  }
}

type Comparator<T> = (a: T, b: T) => boolean
function getIndex<T>(list: T[], target: T, comparator: Comparator<T>) {
  for (let i = 0; i < list.length; i++) {
    if (comparator(target, list[i])) return i
  }
  return list.length
}

type $$Observable<T> = Observable<$$Return<T>>

export function $for<T>(array: $$Observable<T>, pipe: OperatorFunction<T, DomElement | SimpleType>, props?: { comparator?: Comparator<T> }): DomElement
export function $for<T>(array: $$Observable<T>, pipe: OperatorFunction<T, DomElement | SimpleType>, props: { detached: false, comparator?: Comparator<T> }): DomElement
export function $for<T>(array: $$Observable<T>, pipe: OperatorFunction<[T, Observable<boolean>], DomElement | SimpleType>, props: { detached: true, comparator?: Comparator<T> }): DomElement
export function $for<T>(array: $$Observable<T>, pipe: OperatorFunction<T | [T, Observable<boolean>], DomElement | SimpleType>, props?: { detached?: boolean, comparator?: Comparator<T> }): DomElement {
  const fragment = props && props.detached ? createDetachedFragment<T>(pipe) : createAttachedFragment<T>(pipe)
  const list: T[] = []

  array.pipe(untilExist(fragment.anchor)).subscribe({
    next(args) {
      if ('insert' in args) {
        const i = props?.comparator ? getIndex(list, args.item, props.comparator) : list.length
        if (i < 0) { throw new Error('index is invalid') }
        list.splice(i, 0, args.item)
        fragment.insert(args.item, i)
      } else if ('remove' in args) {
        const i = list.map(item => getCollectionItemId(item)).indexOf(getCollectionItemId(args.item))

        if (i < 0) return
        list.splice(i, 1)
        fragment.remove(args.item, i)
      }
    },
    complete() { fragment.clear() }
  })

  return fragment.anchor
}
