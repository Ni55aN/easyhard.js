import { DomElement, Child } from "./types";
import { appendChild } from "./core";

export function insertAfter(newNode: Node, parentNode: Node, referenceNode: DomElement): void {
    parentNode.insertBefore(newNode, referenceNode && referenceNode.nextSibling);
}

export function getNested(nodes: NodeList): Node[] {
  return Array.from(nodes).reduce((acc, node) => ([...acc, node, ...getNested(node.childNodes)]), [] as Node[]);
}

export function createFragment(): { anchor: Text; edge: DomElement; insert: (item: Child, i?: number) => void; remove: (i: number) => void } {
  const anchor = document.createTextNode('');
  const elements: DomElement[] = [];

  return {
    anchor,
    get edge(): DomElement {
      return elements[elements.length - 1] || anchor;
    },
    insert(item: Child, i = elements.length): void {
      const el = appendChild(item, anchor.parentElement as ChildNode, elements[i - 1] || anchor);
      
      elements.splice(i, 0, el);
    },
    remove(i: number): void {
      const exist = elements[i];
      
      if (exist && 'remove' in exist) exist.remove();
      elements.splice(i, 1);
    }
  }
}