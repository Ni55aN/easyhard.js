import { appendChild } from './core';
import { Anchor, Child, DomElement } from './types';
import { createAnchor, getEdge } from './utils'

export function createFragment(): { anchor: Anchor; insert: (item: Child, i?: number) => void; remove: (i: number) => void; clear: () => void } {
  const anchor = createAnchor();
  const elements: DomElement[] = [];

  return {
    anchor,
    insert(item: Child, i = elements.length): void {
      if (!anchor.parentElement) { console.warn('Attempt to add Child, but the anchor has been removed'); return; }
      const el = appendChild(item, anchor.parentElement as ChildNode, getEdge(elements[i - 1]) || anchor);

      elements.splice(i, 0, el);
      anchor.edge = elements[elements.length - 1];
    },
    remove(i: number): void {
      const exist = elements[i];
      
      if (exist && 'remove' in exist) exist.remove();
      elements.splice(i, 1);
      anchor.edge = elements[elements.length - 1];
    },
    clear(): void {
      elements.forEach(el => {
        if (el && 'remove' in el) el.remove();
      });
      elements.splice(0, elements.length);
      anchor.edge = undefined;
    }
  }
}