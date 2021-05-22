import { untilExist } from 'easyhard'
import { MonoTypeOperatorFunction, pipe } from 'rxjs'

export function untilExistStyle<T>(style: HTMLStyleElement, parent: ChildNode | null): MonoTypeOperatorFunction<T> {
  if (parent) return pipe(untilExist<T>(style, document.head), untilExist(parent))
  return untilExist<T>(style, document.head)
}
