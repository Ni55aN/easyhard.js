import { Observable } from "rxjs";
import { DomElement, Attrs, Child } from "./types";
import { Fragment } from "./fragment";
import { insertAfter } from "./utils";


export function createElement<T extends (...args: any) => any, Props extends Parameters<T>[0]>(tag: T | string, attrs: Props, ...children: any[]): HTMLElement;
export function createElement(tag: string, attrs: Attrs, ...children: any[]): HTMLElement
export function createElement<T extends (...args: any) => any, Props extends Parameters<T>[0]>(tag: T | string, attrs: Props | Attrs, ...children: any[]): HTMLElement {
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
        const sub = value.subscribe(v => {
          element.setAttribute(name, v.toString());
          (element as any)[name] = v.toString();
        });
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

export function removeChild(element: DomElement | Fragment) {
  if (!element) return;

  if ('remove' in element) {
    element.remove();
  }
}

export function appendChild(child: Child, parent: ChildNode, after: Fragment | DomElement = null): DomElement | Fragment {
  if (child instanceof Function) {
    return appendChild(child(parent), parent, after);
  } else {
    const el = resolveChild(child);
    if (el) {
      if (after) {
        insertAfter(el instanceof Fragment ? el.getRoot() : el, parent, after instanceof Fragment ? after.getEdge() : after);
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
