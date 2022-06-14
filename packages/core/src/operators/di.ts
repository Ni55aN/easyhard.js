import { $ } from 'easyhard-common'
import { Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { untilExist } from './until-exist'
import { Child } from '../types'
import { createAnchor } from '../utils'
import { debugFragment } from '../devtools'

type DiKey<T> = { new(): unknown } | { (...args: T[]): unknown } | Record<string, unknown>;
type DiValue<T> = Subject<T>;
type DiInjection<T> = WeakMap<Node, T>;

class Injections {
  map = new WeakMap<DiKey<unknown>, DiInjection<unknown>>()
  list$ = $<Node | null>(null)

  observe<T, K>(id: DiKey<K>): Observable<DiInjection<T>> {
    return this.list$.pipe(
      map(() => this.getNodeMap(id))
    )
  }

  next<T,K>(id: DiKey<K>, node: Node, value: T): void {
    this.getNodeMap(id).set(node, value)
    this.list$.next(null)
  }

  private getNodeMap<T,K>(id: DiKey<K>): DiInjection<T> {
    let m = this.map.get(id as DiKey<unknown>)

    if (!m) {
      m = new WeakMap()
      this.map.set(id as DiKey<unknown>, m)
    }
    return m as DiInjection<T>
  }

  static find<T>(el: Node | null, data: DiInjection<T>): { value: T } | null {
    if (!el) return null
    if (data.has(el)) return { value: data.get(el) as T }

    return this.find<T>(el.parentElement, data)
  }
}

const injections = new Injections()

export function $provide<T, K>(id: DiKey<K>, value: DiValue<T>): Child {
  const anchor = createAnchor()

  debugFragment(anchor, '$provide', value)

  value.pipe(untilExist(anchor)).subscribe(value => {
    if (!anchor.parentNode) throw new Error('parentNode is undefined')
    injections.next(id, anchor.parentNode, value)
  })

  return anchor
}

export function $inject<T, K>(id: DiKey<K>, act: DiValue<T>): Child {
  const anchor = createAnchor()
  const injection = injections.observe<T, K>(id)

  debugFragment(anchor, '$inject', act)

  injection.pipe(untilExist(anchor)).subscribe(injectionValue => {
    const target = anchor.parentNode
    if (!target) return

    const result = Injections.find(target.parentElement, injectionValue)

    if (result) {
      act.next(result.value)
    }
  })

  return anchor
}
