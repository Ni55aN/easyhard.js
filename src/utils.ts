import { DomElement, Child } from "./types";
import { appendChild } from "./core";

export function insertNode(newNode: Node, parentNode: Node, after: DomElement = null): void {
  parentNode.insertBefore(newNode, after && after.nextSibling);
}

export function getNested(nodes: NodeList): Node[] {
  return Array.from(nodes).reduce((acc, node) => ([...acc, node, ...getNested(node.childNodes)]), [] as Node[]);
}

export function createFragment(): { anchor: Text; edge: DomElement; insert: (item: Child, i?: number) => void; remove: (i: number) => void; clear: () => void } {
  const anchor = document.createTextNode('');
  const elements: DomElement[] = [];

  return {
    anchor,
    get edge(): DomElement {
      return elements[elements.length - 1] || anchor;
    },
    insert(item: Child, i = elements.length): void {
      if (!anchor.parentElement) { console.warn('Attempt to add Child, but the anchor has been removed'); return; }
      const el = appendChild(item, anchor.parentElement as ChildNode, elements[i - 1] || anchor);
      
      elements.splice(i, 0, el);
    },
    remove(i: number): void {
      const exist = elements[i];
      
      if (exist && 'remove' in exist) exist.remove();
      elements.splice(i, 1);
    },
    clear(): void {
      elements.forEach(el => {
        if (el && 'remove' in el) el.remove();
      });
      elements.splice(0, elements.length);
    }
  }
}