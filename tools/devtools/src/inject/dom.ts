import { EhMeta, EhNode } from './types'

export function findElementByDebugId(node: (HTMLElement | Text) & EhMeta, id: string): HTMLElement | Text | null { // TODO performance
  if (node?.__easyhard?.id === id) return node

  for (const child of Array.from(node.childNodes)) {
    const found = findElementByDebugId(child as (HTMLElement | Text) & EhMeta, id)

    if (found) return found
  }
  return null
}

export function traverseSubtree(node: Node): Node[] {
  return [node, ...Array.from(node.childNodes).map(traverseSubtree)].flat()
}

export function findParent(node: Node, cb: (node: EhNode) => boolean): Node | null {
  if (!node.parentNode) return null
  if (cb(node.parentNode as EhNode)) return node.parentNode

  return findParent(node.parentNode, cb)
}
