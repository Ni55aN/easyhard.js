import { $$Return, getCollectionItemId } from 'easyhard-common'
import { Child, DomElement } from '../types'
import { Observable } from 'rxjs'
import { untilExist } from '../operators/until-exist'
import { createFragment } from '../fragment'
import { debugFragmentAddParent, debugFragmentLabel } from '../devtools'

type Comparator<T> = (a: T, b: T) => boolean

function getIndex<T>(list: T[], target: T, comparator: Comparator<T>) {
  for (let i = 0; i < list.length; i++) {
    if (comparator(target, list[i])) return i
  }
  return list.length
}

type $$Observable<T> = Observable<$$Return<T>>

export function $for<T>(collection: $$Observable<T>, render: (item: T) =>  Child, props?: { comparator?: Comparator<T> }): DomElement {
  const fragment = createFragment()
  const list: T[] = []

  debugFragmentLabel(fragment.anchor, '$for')
  debugFragmentAddParent(fragment.anchor, collection)

  collection.pipe(untilExist(fragment.anchor)).subscribe({
    next(args) {
      if ('insert' in args) {
        const i = props?.comparator ? getIndex(list, args.item, props.comparator) : list.length
        if (i < 0) { throw new Error('index is invalid') }
        list.splice(i, 0, args.item)
        fragment.insert(render(args.item), i)
      } else if ('remove' in args) {
        const i = list.map(item => getCollectionItemId(item)).indexOf(getCollectionItemId(args.item))

        if (i < 0) return
        list.splice(i, 1)
        fragment.remove(i)
      }
    },
    complete() {
      fragment.clear()
      fragment.anchor.remove()
    }
  })
  return fragment.anchor
}
