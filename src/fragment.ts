import { DomElement } from "./types";

export class Fragment {
    private elements: (DomElement | Fragment)[] = [];
    private anchor: Comment;
  
    constructor(id: string) {
      this.anchor = document.createComment(id);
    }
  
    getRoot(): Comment {
      return this.anchor;
    }
  
    getEdge(i = this.elements.length): DomElement {
      const el = this.elements[i - 1];
  
      return (el instanceof Fragment ? el.getEdge() : el) || this.anchor;
    }
  
    get(i: number): DomElement | Fragment {
      return this.elements[i];
    }
  
    insertChild(item: DomElement | Fragment, i: number = this.elements.length): void {
      this.elements.splice(i, 0, item);
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