import { $ } from 'easyhard-common'
import { first } from 'rxjs/operators'
import { untilExist } from '../operators'

type Callback = () => void

export function onMount(el: ChildNode, callback: Callback): void {
  $('').pipe(untilExist(el), first()).subscribe({ next: callback })
}

export function onLife(el: ChildNode, callback: () => (void | Callback)): void {
  let destroy: void | Callback

  $('').pipe(untilExist(el)).subscribe({
    next() { destroy = callback() },
    complete() { destroy && destroy() }
  })
}

export function onDestroy(el: ChildNode, callback: Callback): void {
  $('').pipe(untilExist(el)).subscribe({ complete: callback })
}
