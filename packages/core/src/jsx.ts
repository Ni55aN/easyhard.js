import { createElement } from './core'
import { Child, Attrs, TagName, ElementType } from './types'

export function createElementX<T extends (...args: unknown[]) => HTMLElement, Props extends Parameters<T>[0]>(tag: T, attrs: Props, ...children: Child[]): HTMLElement;
export function createElementX<K extends TagName>(tag: K, attrs: Attrs<K>, ...children: Child[]): ElementType<K>
export function createElementX<K extends TagName, T extends (...args: unknown[]) => ElementType<K>, Props extends Parameters<T>[0]>(tag: K | T, attrs: Props | Attrs<K>, ...children: Child[]): ElementType<K> {
  if (typeof tag === 'function') {
    return tag(attrs)
  }

  return createElement(tag, attrs as Attrs<K>, ...children)
}
