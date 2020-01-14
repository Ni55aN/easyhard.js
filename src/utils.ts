import { DomElement } from "./types";

export function insertAfter(newNode: Node, parentNode: Node, referenceNode: DomElement): void {
    parentNode.insertBefore(newNode, referenceNode && referenceNode.nextSibling);
}

export function getNested(nodes: NodeList): Node[] {
  return Array.from(nodes).reduce((acc, node) => ([...acc, node, ...getNested(node.childNodes)]), [] as Node[]);
}