import { DomElement, Anchor } from './types'

export function createAnchor(): Anchor {
  return document.createTextNode('')
}

export function getEdge(anchor: DomElement): DomElement {
  return anchor && 'edge' in anchor && anchor.edge || anchor
}

export function insertNode(newNode: Node, parentNode: Node, after: DomElement = null): void {
  parentNode.insertBefore(newNode, after && after.nextSibling)
}

export function getNested(nodes: NodeList): Node[] {
  return Array.from(nodes).reduce((acc, node) => ([...acc, node, ...getNested(node.childNodes)]), [] as Node[])
}
