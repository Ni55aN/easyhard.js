import { DomElement, Child } from "./types";
import { appendChild } from "./core";

export class Fragment {
    private elements: (DomElement | Fragment)[] = [];
    private anchor: Text;
  
    constructor() {
      this.anchor = document.createTextNode('');
    }
  
    getRoot(): Text {
      return this.anchor;
    }
  
    getEdge(i = this.elements.length): DomElement {
      const el = this.elements[i - 1];
  
      return (el instanceof Fragment ? el.getEdge() : el) || this.anchor;
    }
  
    get(i: number): DomElement | Fragment {
      return this.elements[i];
    }
  
    insertChild(item: Child, i: number = this.elements.length): void {
      const el = appendChild(item, this.getRoot().parentElement as ChildNode, this.getEdge(i));

      this.elements.splice(i, 0, el);
    }
  
    clear(): void {
      this.elements.forEach(el => el && el.remove());
      this.elements.splice(0, this.elements.length);
    }
  
    removeChild(i: number): void {
      const child = this.get(i);
    
      child && child.remove();
      this.elements.splice(i, 1);
    }
  
    remove(): void {
      this.clear();
      this.anchor.remove();
    }
}