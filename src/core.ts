import { Observable } from "rxjs";
import { DomElement, Attrs, Child } from "./types";
import { Fragment } from "./fragment";
import { insertAfter } from "./utils";

export function createElement(tag: string, attrs: Attrs, ...children: Child[]): HTMLElement {
  const element = document.createElement(tag);

  for (let name in attrs) {
    if (name && attrs.hasOwnProperty(name)) {
      let value = attrs[name];

      if (value === true) {
        element.setAttribute(name, name);
      } else if (value instanceof Observable) {
        const sub = value.subscribe(v => {
          const value = v && v.toString && v.toString();

          element.setAttribute(name, value);
          (element as any)[name] = value;
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

// TODO
export function removeChild(element: DomElement | ChildNode | Fragment) {
  if (!element) return;

  if ('remove' in element) {
    if (element instanceof HTMLElement) {
      Array.from(element.childNodes).map(removeChild);
    }
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

function resolveChild(child: Child): DomElement | Fragment {
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

  if (child && 'render' in child) {
    return child.render();
  }

  return child;
}
