import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'
import { untilExist } from '../operators'
import { $ } from '../structures/value'

type Cb = () => void

const onMountElement = (el: ChildNode, cb: Cb) => $('').pipe(untilExist(el), first()).subscribe(cb)
const onMountInjected = (cb: Cb) => new Observable<null>(() => cb()) // FIXME

export function onMount(...args: Parameters<typeof onMountElement>): void;
export function onMount(...args: Parameters<typeof onMountInjected>): Observable<null>
export function onMount(...args: Parameters<typeof onMountElement> | Parameters<typeof onMountInjected>): Observable<null> | void {
  const [el, cb] = args
  if (typeof el === 'function') return onMountInjected(el)
  else onMountElement(el, cb as Cb)
}

const onDestroyElement = (el: ChildNode, cb: Cb) => $('').pipe(untilExist(el)).subscribe({ complete: cb })
const onDestroyInjected = (cb: Cb) => new Observable<null>(() => cb)

export function onDestroy(...args: Parameters<typeof onDestroyElement>): void;
export function onDestroy(...args: Parameters<typeof onDestroyInjected>): Observable<null>
export function onDestroy(...args: Parameters<typeof onDestroyElement> | Parameters<typeof onDestroyInjected>): Observable<null> | void {
  const [el, cb] = args
  if (typeof el === 'function') return onDestroyInjected(el)
  else onDestroyElement(el, cb as Cb)
}