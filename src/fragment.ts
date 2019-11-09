import { DomElement } from "./types";
import { removeChild } from "./core";

export class Fragment {
    private elements: (DomElement | Fragment)[] = [];
    private anchor: Comment;
  
    constructor(id: string) {
      this.anchor = document.createComment(id);
    }
  
    getRoot() {
      return this.anchor;
    }
  
    getEdge(i = this.elements.length): DomElement {
      const el = this.elements[i - 1];
  
      return (el instanceof Fragment ? el.getEdge() : el) || this.anchor;
    }
  
    get(i: number) {
      return this.elements[i];
    }
  
    insertChild(item: DomElement | Fragment, i: number = this.elements.length) {
      this.elements.splice(i, 0, item);
    }
  
    clear() {
      this.elements.forEach(el => removeChild(el));
      this.elements.splice(0, this.elements.length);
    }
  
    removeChild(i: number) {
      removeChild(this.get(i));
      this.elements.splice(i, 1);
    }
  
    remove() {
      this.clear();
      this.anchor.remove();
    }
}