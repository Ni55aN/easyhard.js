import { Observable } from "rxjs";

type Attrs = {[key: string]: any};

export function h<T extends (...args: any) => any, Props extends Parameters<T>[0]>(tag: T | string, attrs: Props, ...children: any[]): HTMLElement;
export function h(tag: string, attrs: Attrs, ...children: any[]): HTMLElement
export function h<T extends (...args: any) => any, Props extends Parameters<T>[0]>(tag: T | string, attrs: Props | Attrs, ...children: any[]): HTMLElement {
  if (typeof tag === "function") {
    return tag(attrs);
  }

  const element = document.createElement(tag);
  attrs = attrs as Attrs;

  for (let name in attrs) {
    if (name && attrs.hasOwnProperty(name)) {
      let value = attrs[name];

      if (value === true) {
        element.setAttribute(name, name);
      } else if (value instanceof Observable) {
        const sub = value.subscribe(v => element.setAttribute(name, v.toString()));
        overrideRemove(element, () => sub.unsubscribe());
      } else if (typeof value === "function") {
        element.addEventListener(name, value);
      } else if (value !== false && value != null) {
        element.setAttribute(name, value.toString());
      }
    }
  }

  for(let child of children) {
    appendChild(child, element);
  }

  return element;
}

function insertAfter(newNode: Node | Fragment, parentNode: Node, referenceNode: DomElement) {
  parentNode.insertBefore(newNode instanceof Fragment ? newNode.getRoot() : newNode, referenceNode && referenceNode.nextSibling);
}

export class Fragment {
  // tail: DomElement | null = null;
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

  insertChild(item: DomElement | Fragment, i: number = this.elements.length - 1) {
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


export type FunctionalChild = (parent: ChildNode) => DomElement | Fragment;
export type DomElement = Comment | HTMLElement | Text | null;

export function removeChild(element: DomElement | Fragment) {
  if (!element) return;

  if ('remove' in element) {
    element.remove();
  }
}

export function appendChild(child: DomElement | Fragment | FunctionalChild | string, parent: ChildNode, after: Fragment | DomElement = null): DomElement | Fragment {
  if (child instanceof Function) {
    return appendChild(child(parent), parent, after);
  } else {
    const el = resolveChild(child);
    if (el) {
      if (after) {
        insertAfter(el, parent, after instanceof Fragment ? after.getEdge() : after);
      } else {
        parent.appendChild(el instanceof Fragment ? el.getRoot() : el);
      }
      overrideRemove(parent, () => el.remove());
    }
    return el;
  }
}

export function overrideRemove(el: ChildNode | Fragment, cb: any) {
  const remove = el.remove;

  el.remove = function() {
    cb();
    remove.apply(this, arguments as any);
  };
}

function resolveChild(child: Observable<any> | DomElement | Fragment | string): DomElement | Fragment {
  if (child instanceof Observable) {
    const text = document.createTextNode('');
    const sub = child.subscribe(v => {
      if (text) {
        text.textContent = v;
      }
    });
    overrideRemove(text, () => sub.unsubscribe());
    return text;
  }

  if (child instanceof Fragment) {
    return child;
  }
  
  if (typeof child !== "object") {
    return document.createTextNode(child.toString());
  }

  return child;
}
