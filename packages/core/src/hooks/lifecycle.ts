import { first } from 'rxjs/operators'
import { untilExist } from '../operators'
import { $ } from '../structures/value'

type Callback = () => void

export function onMount(el: ChildNode, callback: Callback): void {
  $('').pipe(untilExist(el), first()).subscribe({ next: callback })
}

export function onDestroy(el: ChildNode, callback: Callback): void {
  $('').pipe(untilExist(el)).subscribe({ complete: callback })
}